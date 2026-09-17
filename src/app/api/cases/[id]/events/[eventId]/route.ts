import { NextRequest, NextResponse } from 'next/server';
import { caseEvent } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import { canEditCaseTimelineEvent } from '@/lib/auth/permissions';
import { triggerEvent } from '@/lib/realtime/server';

const MAX_DESCRIPTION_LENGTH = 5000;

/** Edición posterior de un registro del timeline (RF-04): corrige o complementa la descripción. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const { id, eventId } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!canEditCaseTimelineEvent(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'La línea de tiempo es de solo lectura para tu rol' }, { status: 403 });
    }

    const body = await request.json();
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (!description) {
      return NextResponse.json({ success: false, error: 'La descripción no puede quedar vacía' }, { status: 400 });
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json({ success: false, error: 'La descripción es demasiado larga' }, { status: 400 });
    }

    const existing = await caseEvent.getCaseEventById(id, eventId);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Evento no encontrado' }, { status: 404 });
    }

    const updated = await caseEvent.updateCaseEventDescription(id, eventId, description);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Evento no encontrado' }, { status: 404 });
    }
    delete updated.createdByRole;

    triggerEvent('case:updated', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando el evento' }, { status: 500 });
  }
}
