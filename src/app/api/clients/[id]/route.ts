import { NextRequest, NextResponse } from 'next/server';
import { crmClient, registroPeritus, queryOne } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { guardRole } from '@/lib/auth/guard';
import { canManageClients } from '@/lib/auth/permissions';
import { actorFromRequest } from '@/lib/auth/caseAccess';
import { CLIENT_TYPES, type ClientType } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = actorFromRequest(request);
    if (!actor || !['admin', 'juridico', 'mercadeo', 'financiero'].includes(actor.role)) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }
    if (actor.role === 'financiero') {
      const assigned = await queryOne<{ allowed: boolean }>(
        'SELECT EXISTS(SELECT 1 FROM cases WHERE client_id = $1 AND assigned_financiero_id = $2) AS allowed',
        [id, actor.userId],
      );
      if (!assigned?.allowed) return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }
    const clientData = await crmClient.getClientById(id);

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

    const stop = guardRole(request, canManageClients);
    if (stop) return stop;

    const body = await request.json();
    const { name, email, phone, company, position, notes, status, clientType } = body as {
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
      position?: string;
      notes?: string;
      status?: 'activo' | 'inactivo' | 'prospecto';
      clientType?: ClientType;
    };

    if (clientType && !CLIENT_TYPES.includes(clientType)) {
      return NextResponse.json({ success: false, error: 'Tipo de cliente no válido' }, { status: 400 });
    }

    const updated = await crmClient.updateClient(id, {
      name, email, phone, company, position, notes, status, clientType,
    });

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canManageClients);
    if (stop) return stop;

    // Block deletion if client has cases
    const row = await queryOne<{ count: number }>(
      'SELECT count(*)::int AS count FROM cases WHERE client_id = $1',
      [id]
    );
    const casesCount = row?.count ?? 0;
    if (casesCount > 0) {
      return NextResponse.json(
        { success: false, error: `No se puede eliminar: el cliente tiene ${casesCount} caso(s) asociado(s). Elimínelos primero.` },
        { status: 409 }
      );
    }

    // Delete associated registroPeritus if exists
    const registro = await registroPeritus.getRegistroByClientId(id);
    if (registro) {
      await registroPeritus.deleteRegistroPeritus(registro._id);
    }

    await crmClient.deleteClient(id);
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
