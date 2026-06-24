import { NextRequest, NextResponse } from 'next/server';
import { expert } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { EXPERT_VALIDATION_STATUSES, type ExpertValidationStatus } from '@/lib/types';
import { guardRole } from '@/lib/auth/guard';
import { canManageExperts } from '@/lib/auth/permissions';

/**
 * Transiciones del ciclo de vida del perito:
 *   candidato → en_evaluacion → activado   (+ rechazado en cualquier momento).
 * Recibe { status: ExpertValidationStatus, notes? }. 'rechazado' exige notas.
 */
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
    const { status, notes } = body as { status?: string; notes?: string };

    if (!status || !EXPERT_VALIDATION_STATUSES.includes(status as ExpertValidationStatus)) {
      return NextResponse.json(
        { success: false, error: 'Estado inválido. Debe ser candidato, en_evaluacion, activado o rechazado.' },
        { status: 400 },
      );
    }

    if (status === 'rechazado' && !notes) {
      return NextResponse.json({ success: false, error: 'Las notas son requeridas para rechazar' }, { status: 400 });
    }

    const existing = await expert.getExpertById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Perito no encontrado' }, { status: 404 });
    }

    const updated = await expert.updateExpert(id, {
      validationStatus: status as ExpertValidationStatus,
      validationNotes: notes ?? existing.validationNotes ?? '',
      validatedById: userId && userId !== 'admin' ? userId : null,
    });

    triggerEvent('expert:updated', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando estado del perito' }, { status: 500 });
  }
}
