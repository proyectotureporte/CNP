import { NextRequest, NextResponse } from 'next/server';
import { expert } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import type { ExpertValidationStatus } from '@/lib/types';
import { guardRole } from '@/lib/auth/guard';
import { canManageExperts } from '@/lib/auth/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canManageExperts);
    if (stop) return stop;

    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const { action, notes } = body;

    if (!action || !['aprobado', 'rechazado'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Accion debe ser "aprobado" o "rechazado"' }, { status: 400 });
    }

    if (action === 'rechazado' && !notes) {
      return NextResponse.json({ success: false, error: 'Las notas son requeridas para rechazar' }, { status: 400 });
    }

    const existing = await expert.getExpertById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Perito no encontrado' }, { status: 404 });
    }

    const updated = await expert.updateExpert(id, {
      validationStatus: action as ExpertValidationStatus,
      validationNotes: notes || '',
      validatedById: userId && userId !== 'admin' ? userId : null,
    });

    triggerEvent('expert:updated', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error validando perito' }, { status: 500 });
  }
}
