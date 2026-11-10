import { NextRequest, NextResponse } from 'next/server';
import { caseEvent, caseDocument } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import { canEditCaseTimelineEvent } from '@/lib/auth/permissions';
import { triggerEvent } from '@/lib/realtime/server';
import { auditEntityChange } from '@/lib/audit';
import { notifyCaseClient } from '@/lib/notifyClient';

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

/**
 * Edición posterior de una actuación (RF-04): descripción, título, fecha,
 * visibilidad para el cliente y documento de soporte. Nunca se borra.
 */
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

    const existing = await caseEvent.getCaseEventById(id, eventId);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Evento no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const patch: Parameters<typeof caseEvent.updateCaseEvent>[2] = {};

    if (body.description !== undefined) {
      const description = typeof body.description === 'string' ? body.description.trim() : '';
      if (!description) {
        return NextResponse.json({ success: false, error: 'La descripción no puede quedar vacía' }, { status: 400 });
      }
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        return NextResponse.json({ success: false, error: 'La descripción es demasiado larga' }, { status: 400 });
      }
      patch.description = description;
    }
    if (body.title !== undefined) {
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      if (title.length > MAX_TITLE_LENGTH) {
        return NextResponse.json({ success: false, error: 'El título es demasiado largo' }, { status: 400 });
      }
      patch.title = title || null;
    }
    if (body.isVisibleToClient !== undefined) {
      patch.isVisibleToClient = Boolean(body.isVisibleToClient);
    }
    if (body.eventDate !== undefined) {
      const date = new Date(String(body.eventDate));
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json({ success: false, error: 'Fecha no válida' }, { status: 400 });
      }
      patch.eventDate = date.toISOString();
    }
    if (body.documentId !== undefined) {
      const documentId = typeof body.documentId === 'string' && body.documentId ? body.documentId : null;
      if (documentId) {
        const docCaseId = await caseDocument.getCaseDocumentCaseId(documentId);
        if (docCaseId !== id) {
          return NextResponse.json({ success: false, error: 'El documento no pertenece a este caso' }, { status: 400 });
        }
      }
      patch.documentId = documentId;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: false, error: 'Nada que actualizar' }, { status: 400 });
    }

    const updated = await caseEvent.updateCaseEvent(id, eventId, patch);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Evento no encontrado' }, { status: 404 });
    }

    auditEntityChange({
      request, action: 'update', entityType: 'case_event', entityId: eventId, caseId: id,
      before: {
        title: existing.title ?? null, description: existing.description ?? '',
        isVisibleToClient: existing.isVisibleToClient ?? false, eventDate: existing.eventDate ?? null,
        documentId: existing.document?._id ?? null,
      },
      after: {
        title: updated.title ?? null, description: updated.description ?? '',
        isVisibleToClient: updated.isVisibleToClient ?? false, eventDate: updated.eventDate ?? null,
        documentId: updated.document?._id ?? null,
      },
    });

    // Publicar una actuación que antes era interna equivale a una actuación nueva para el cliente.
    if (!existing.isVisibleToClient && updated.isVisibleToClient) {
      notifyCaseClient({
        caseId: id,
        title: `Nueva actuación: ${updated.title || 'actualización de tu caso'}`,
        message: updated.description || updated.title || '',
        portalPath: `/portal/cases/${id}?tab=timeline`,
        email: {
          subject: 'Nueva actuación en tu caso',
          body: `Registramos una nueva actuación en tu caso:\n\n${updated.title ? `${updated.title}\n` : ''}${updated.description ?? ''}`,
          ctaLabel: 'Ver el seguimiento',
        },
      });
    }

    delete updated.createdByRole;
    triggerEvent('case:updated', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando el evento' }, { status: 500 });
  }
}
