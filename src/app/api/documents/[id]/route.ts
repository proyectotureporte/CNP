import { NextRequest, NextResponse } from 'next/server';
import { caseDocument } from '@/lib/db';
import {
  CASE_DOCUMENT_STATUSES,
  CASE_DOCUMENT_STATUS_LABELS,
  type CaseDocumentStatus,
  type DocumentCategory,
} from '@/lib/types';
import { canManageDocumentChecklist } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';
import { auditEntityChange } from '@/lib/audit';
import { requireCaseAccess } from '@/lib/auth/caseAccess';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseId = await caseDocument.getCaseDocumentCaseId(id);
    if (!caseId) return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;
    const doc = await caseDocument.getCaseDocumentById(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    }
    const isExpert = access.actor.role === 'perito' || access.actor.role === 'perito_interno';
    if (!access.actor.allRoles && !['comercial_juridico', 'junta', 'perito_interno', 'perito', 'cliente'].includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    }
    if (isExpert && doc.category === 'pago') {
      return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    }
    if (access.actor.role === 'cliente' && (!doc.isVisibleToClient || doc.category === 'dictamen_final')) {
      return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    }
    const safe = { ...doc, fileUrl: undefined, downloadUrl: doc.fileName ? `/api/documents/${id}/download` : undefined };
    if (isExpert || access.actor.role === 'cliente') {
      delete safe.uploadedBy;
      delete safe.uploadedByName;
    }
    return NextResponse.json({ success: true, data: safe });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo documento' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    }
    await caseDocument.deleteCaseDocument(id);
    triggerEvent('document:deleted', { id });
    return NextResponse.json({ success: true, data: { message: 'Documento eliminado' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error eliminando documento' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const body = await request.json();

    const doc = await caseDocument.getCaseDocumentById(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    }

    if (body.status !== undefined && !CASE_DOCUMENT_STATUSES.includes(body.status as CaseDocumentStatus)) {
      return NextResponse.json({ success: false, error: 'Estado de documento no valido' }, { status: 400 });
    }

    const updated = await caseDocument.updateCaseDocument(id, {
      isVisibleToClient: body.isVisibleToClient,
      description: body.description,
      category: body.category as DocumentCategory | undefined,
      status: body.status as CaseDocumentStatus | undefined,
      isRequired: body.isRequired as boolean | undefined,
    });

    if (body.status !== undefined && body.status !== doc.status && updated) {
      const userId = request.headers.get('x-user-id');
      const userName = request.headers.get('x-user-name');
      const name = doc.description || doc.fileName || doc.category;
      logCaseEvent({
        caseId,
        eventType: 'document_uploaded',
        description: `Checklist documental: "${name}" marcado como ${CASE_DOCUMENT_STATUS_LABELS[body.status as CaseDocumentStatus]}`,
        userId, userName,
      });
      auditEntityChange({
        request,
        action: 'update',
        entityType: 'case_document',
        entityId: id,
        before: { status: doc.status },
        after: { status: body.status },
      });
    }

    triggerEvent('document:created', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando documento' }, { status: 500 });
  }
}
