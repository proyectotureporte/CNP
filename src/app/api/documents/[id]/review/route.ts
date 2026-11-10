import { NextRequest, NextResponse } from 'next/server';
import { caseDocument } from '@/lib/db';
import { actorUserReference, requireCaseAccess } from '@/lib/auth/caseAccess';
import { canManageDocumentChecklist } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';
import { auditEntityChange } from '@/lib/audit';
import { notifyCaseClient, portalCaseUrl } from '@/lib/notifyClient';
import {
  CASE_DOCUMENT_REVIEW_LABELS,
  CASE_DOCUMENT_REVIEW_STATUSES,
  type CaseDocumentReviewStatus,
} from '@/lib/types';

const MAX_NOTE_LENGTH = 2000;

/**
 * Revisión documental: aprueba o devuelve un documento recibido. Al devolverlo
 * ("requiere corrección") la observación es obligatoria y el cliente recibe el
 * aviso para aportar una versión nueva; la anterior se conserva como historial.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const caseId = await caseDocument.getCaseDocumentCaseId(id);
    if (!caseId) return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;
    if (!canManageDocumentChecklist(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const doc = await caseDocument.getCaseDocumentById(id);
    if (!doc) return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    if (!doc.fileName) {
      return NextResponse.json({ success: false, error: 'Este requerido aún no tiene archivo para revisar' }, { status: 409 });
    }
    if (doc.supersededAt) {
      return NextResponse.json({ success: false, error: 'Esta versión fue reemplazada; revisa la versión vigente' }, { status: 409 });
    }

    const body = await request.json().catch(() => ({}));
    const reviewStatus = String(body.reviewStatus || '') as CaseDocumentReviewStatus;
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (!CASE_DOCUMENT_REVIEW_STATUSES.includes(reviewStatus)) {
      return NextResponse.json({ success: false, error: 'Estado de revisión no válido' }, { status: 400 });
    }
    if (reviewStatus === 'requiere_correccion' && note.length < 5) {
      return NextResponse.json({ success: false, error: 'Indica qué debe corregir el cliente (mínimo 5 caracteres)' }, { status: 400 });
    }
    if (note.length > MAX_NOTE_LENGTH) {
      return NextResponse.json({ success: false, error: 'La observación es demasiado larga' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updated = await caseDocument.updateCaseDocument(id, {
      reviewStatus,
      reviewNote: note || null,
      reviewedById: actorUserReference(access.actor),
      reviewedByName: access.actor.displayName,
      reviewedAt: now,
      // Una devolución tiene sentido solo si el cliente la puede ver.
      ...(reviewStatus === 'requiere_correccion' ? { isVisibleToClient: true } : {}),
    });

    const name = doc.description || doc.fileName || doc.category;
    const label = CASE_DOCUMENT_REVIEW_LABELS[reviewStatus];
    logCaseEvent({
      caseId,
      eventType: reviewStatus === 'requiere_correccion' ? 'document_requested' : 'document_uploaded',
      title: reviewStatus === 'aprobado' ? 'Documento aprobado' : reviewStatus === 'requiere_correccion' ? 'Documento devuelto para corrección' : 'Documento en revisión',
      description: reviewStatus === 'requiere_correccion'
        ? `"${name}" (v${doc.version}) requiere corrección: ${note}`
        : `"${name}" (v${doc.version}) marcado como ${label}${note ? `: ${note}` : ''}`,
      isVisibleToClient: reviewStatus !== 'pendiente_revision' && doc.isVisibleToClient !== false,
      documentId: id,
      userId: access.actor.userId,
      userName: access.actor.displayName,
    });
    auditEntityChange({
      request, action: 'update', entityType: 'case_document', entityId: id, caseId,
      before: { reviewStatus: doc.reviewStatus ?? null, reviewNote: doc.reviewNote ?? null },
      after: { reviewStatus, reviewNote: note || null },
    });

    if (reviewStatus === 'requiere_correccion') {
      notifyCaseClient({
        caseId,
        title: `Documento por corregir: ${name}`,
        message: note,
        type: 'warning',
        priority: 'alta',
        portalPath: `/portal/cases/${caseId}?tab=documents`,
        email: {
          subject: 'Necesitamos una nueva versión de un documento',
          body: `Revisamos el documento "${name}" de tu caso y necesitamos que nos envíes una versión corregida.\n\nObservación del equipo:\n${note}`,
          ctaLabel: 'Enviar la versión corregida',
          ctaUrl: portalCaseUrl(caseId, 'documents'),
        },
      });
    } else if (reviewStatus === 'aprobado' && doc.isVisibleToClient) {
      notifyCaseClient({
        caseId,
        title: `Documento aprobado: ${name}`,
        message: `El documento "${name}" fue revisado y aprobado por el equipo.`,
        type: 'success',
        portalPath: `/portal/cases/${caseId}?tab=documents`,
      });
    }

    triggerEvent('document:created', { id, caseId });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[document-review] POST error:', error);
    return NextResponse.json({ success: false, error: 'Error registrando la revisión' }, { status: 500 });
  }
}
