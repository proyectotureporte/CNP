import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getClientByIdQuery } from '@/lib/sanity/queries';
import { triggerEvent } from '@/lib/pusher/server';
import type { CrmClient } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientData = await client.fetch<CrmClient | null>(getClientByIdQuery, { id });

    if (!clientData) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: clientData });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo cliente' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, company, position, notes, status } = body as {
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
      position?: string;
      notes?: string;
      status?: string;
    };

    const updates: Record<string, string> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (company !== undefined) updates.company = company;
    if (position !== undefined) updates.position = position;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;

    const updated = await writeClient.patch(id).set(updates).commit();

    triggerEvent('client:updated', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando cliente' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Block deletion if client has active cases
    const casesCount = await writeClient.fetch<number>(
      `count(*[_type == "case" && client._ref == $id])`,
      { id }
    );
    if (casesCount > 0) {
      return NextResponse.json(
        { success: false, error: `No se puede eliminar: el cliente tiene ${casesCount} caso(s) asociado(s). Elimínelos primero.` },
        { status: 409 }
      );
    }

    // Delete associated registroPeritus if exists (references crmClient)
    const registroPeritus = await writeClient.fetch<{ _id: string } | null>(
      `*[_type == "registroPeritus" && clientRef._ref == $id][0]{ _id }`,
      { id }
    );
    if (registroPeritus) {
      await writeClient.delete(registroPeritus._id);
    }

    await writeClient.delete(id);
    triggerEvent('client:deleted', { id });
    return NextResponse.json({ success: true, data: { message: 'Cliente eliminado' } });
  } catch (err) {
    console.error('[clients] DELETE error:', err);
    return NextResponse.json(
      { success: false, error: 'Error eliminando cliente' },
      { status: 500 }
    );
  }
}
