import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getClientByIdQuery } from '@/lib/sanity/queries';
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
    await writeClient.delete(id);
    return NextResponse.json({ success: true, data: { message: 'Cliente eliminado' } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error eliminando cliente' },
      { status: 500 }
    );
  }
}
