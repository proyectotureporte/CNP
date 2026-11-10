import { NextRequest, NextResponse } from 'next/server';
import { cases, caseEvent } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import { canAddCaseTimelineNote } from '@/lib/auth/permissions';
import { CASE_EVENT_TYPES, type CaseEvent, type CaseEventType } from '@/lib/types';
import { triggerEvent } from '@/lib/realtime/server';
import { auditEntityChange } from '@/lib/audit';
import { notifyCaseClient } from '@/lib/notifyClient';

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

function sanitizeForClient(event: CaseEvent): CaseEvent {
  const safe = { ...event };
  delete safe.createdBy;
  if (safe.createdByRole === 'perito' || safe.createdByRole === 'perito_interno') {
    safe.createdByName = 'Equipo técnico';
  }
  if (safe.eventType === 'assignment') {
    // La descripción histórica incluye el nombre del asignado. Se vuelve
    // genérica para que ninguna variante de rol revele al perito.
    safe.description = 'Equipo responsable del caso actualizado';
  }
  // El documento de soporte solo se referencia si el cliente puede verlo.
  if (safe.document && !safe.document.isVisibleToClient) safe.document = null;
  delete safe.createdByRole;
  return safe;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;

    if (access.actor.role === 'cliente') {
      const events = await caseEvent.listClientVisibleEvents(id);
      return NextResponse.json({ success: true, data: events.map(sanitizeForClient) });
    }

    const events = await caseEvent.listCaseEvents(id);
    const data = events.map((event) => {
      const safe = { ...event };
      if (access.actor.role === 'perito') {
        delete safe.createdBy;
        if (safe.createdByRole === 'cliente') safe.createdByName = 'Cliente final';
      }
      delete safe.createdByRole;
      return safe;
    });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo eventos' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!canAddCaseTimelineNote(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'La línea de tiempo es de solo lectura para tu rol' }, { status: 403 });
    }
    const userId = access.actor.userId;
    const userName = access.actor.displayName;
    const body = await request.json();
    const { eventType, metadata } = body;
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const isVisibleToClient = typeof body.isVisibleToClient === 'boolean' ? body.isVisibleToClient : undefined;
    const documentId = typeof body.documentId === 'string' && body.documentId ? body.documentId : null;
    const eventDate = typeof body.eventDate === 'string' && body.eventDate ? new Date(body.eventDate) : null;

    if (!eventType || !CASE_EVENT_TYPES.includes(eventType as CaseEventType)) {
      return NextResponse.json({ success: false, error: 'Tipo de evento no valido' }, { status: 400 });
    }
    if (!description && !title) {
      return NextResponse.json({ success: false, error: 'Escribe la actuación' }, { status: 400 });
    }
    if (title.length > MAX_TITLE_LENGTH || description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json({ success: false, error: 'El texto es demasiado largo' }, { status: 400 });
    }
    if (eventDate && Number.isNaN(eventDate.getTime())) {
      return NextResponse.json({ success: false, error: 'Fecha no válida' }, { status: 400 });
    }

    const existing = await cases.getCaseById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    const createdId = await caseEvent.createCaseEvent({
      caseId: id,
      eventType,
      title: title || null,
      description,
      eventDate: eventDate ? eventDate.toISOString() : null,
      isVisibleToClient,
      documentId,
      createdById: userId,
      createdByName: userName || 'Sistema',
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
    const created = await caseEvent.getCaseEventById(id, createdId);

    auditEntityChange({
      request, action: 'create', entityType: 'case_event', entityId: createdId, caseId: id,
      after: { eventType, title: title || null, description, isVisibleToClient: created?.isVisibleToClient ?? null },
    });
    if (created?.isVisibleToClient) {
      notifyCaseClient({
        caseId: id,
        title: `Nueva actuación: ${title || 'actualización de tu caso'}`,
        message: description || title,
        portalPath: `/portal/cases/${id}?tab=timeline`,
        email: {
          subject: 'Nueva actuación en tu caso',
          body: `Registramos una nueva actuación en tu caso:\n\n${title ? `${title}\n` : ''}${description}`,
          ctaLabel: 'Ver el seguimiento',
        },
      });
    }

    triggerEvent('case:updated', { id });
    return NextResponse.json({ success: true, data: created ? { ...created, createdByRole: undefined } : { _id: createdId } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando evento' }, { status: 500 });
  }
}
