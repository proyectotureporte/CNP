import { NextRequest, NextResponse } from 'next/server';
import { registroPeritus } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { guardRole } from '@/lib/auth/guard';
import { canManageClients } from '@/lib/auth/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canManageClients);
    if (stop) return stop;

    const body = await request.json();
    const { action, notes } = body;

    if (!action || !['aprobado', 'denegado'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Accion debe ser "aprobado" o "denegado"' },
        { status: 400 }
      );
    }

    if (action === 'denegado' && !notes) {
      return NextResponse.json(
        { success: false, error: 'Las notas son requeridas para denegar' },
        { status: 400 }
      );
    }

    const registro = await registroPeritus.getRegistroByClientId(id);

    if (!registro) {
      return NextResponse.json(
        { success: false, error: 'Registro Peritus no encontrado para este cliente' },
        { status: 404 }
      );
    }

    await registroPeritus.updateRegistroPeritus(registro._id, {
      estadoDocumentacion: action,
      notasValidacion: notes || undefined,
    });
    triggerEvent('client:updated', { id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error validando cliente Peritus' },
      { status: 500 }
    );
  }
}
