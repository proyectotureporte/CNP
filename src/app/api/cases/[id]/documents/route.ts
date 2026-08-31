import { NextRequest, NextResponse } from 'next/server';
import { caseDocument, query } from '@/lib/db';
import { actorUserReference, requireCaseAccess } from '@/lib/auth/caseAccess';
import { uploadFile } from '@/lib/sanity/assets';
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, type CaseDocument, type DocumentCategory } from '@/lib/types';
import { canManageDocumentChecklist } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';
import {
  CASE_DOCUMENT_MAX_SIZE_BYTES,
  CASE_DOCUMENT_MAX_SIZE_MB,
} from '@/lib/files/uploadLimits';

function safeDocument(item: CaseDocument, hideUploader: boolean): CaseDocument {
  const safe = { ...item };
  delete safe.fileUrl;
  if (item.fileName) safe.downloadUrl = `/api/documents/${item._id}/download`;
  if (hideUploader) {
    delete safe.uploadedBy;
    delete safe.uploadedByName;
  }
  return safe;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    const category = request.nextUrl.searchParams.get('category') || '';

    if (access.actor.role === 'cliente') {
      // Los dictámenes se entregan únicamente desde deliverables tras aprobación.
      const documents = (await caseDocument.listClientVisibleDocuments(id))
        .filter((document) => document.category !== 'dictamen_final')
        .map((document) => safeDocument(document, true));
      return NextResponse.json({ success: true, data: documents });
    }

    if (!access.actor.allRoles && !['comercial_juridico', 'junta', 'perito_interno', 'perito'].includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const docs = await caseDocument.listCaseDocuments(id, category);
    const isExpert = access.actor.role === 'perito' || access.actor.role === 'perito_interno';
    const visibleDocs = isExpert
      ? docs.filter((document) => document.category !== 'pago')
      : docs;
    let data: CaseDocument[] = visibleDocs.map((document) =>
      safeDocument(document, isExpert),
    );

    // Los comprobantes del cliente son financieros; nunca se exponen al perito.
    if (!isExpert && (!category || category === 'pago')) {
      const receipts = await query<{
        _id: string; _createdAt: string; paymentNumber: number;
        fileName: string | null; fileSize: number | null; mimeType: string | null;
      }>(
        `SELECT id AS "_id", created_at AS "_createdAt", payment_number AS "paymentNumber",
           file_name AS "fileName", file_size AS "fileSize", mime_type AS "mimeType"
         FROM payment WHERE case_id = $1 AND file_url IS NOT NULL ORDER BY payment_number ASC`,
        [id],
      );
      const existing = new Set(docs.filter((document) => document.category === 'pago').map((document) => document.fileName));
      const virtual: CaseDocument[] = receipts
        .filter((payment) => !existing.has(`Justificante Pago ${payment.paymentNumber}`))
        .map((payment) => ({
          _id: `payment-receipt-${payment._id}`,
          _createdAt: payment._createdAt,
          category: 'pago',
          status: 'recibido',
          isRequired: false,
          fileName: payment.fileName || `Justificante Pago ${payment.paymentNumber}`,
          fileSize: payment.fileSize || 0,
          mimeType: payment.mimeType || 'application/octet-stream',
          version: 1,
          isVisibleToClient: true,
          description: `Justificante Pago ${payment.paymentNumber}`,
          downloadUrl: `/api/payments/${payment._id}/receipt-download`,
        }));
      data = [...data, ...virtual];
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[case-documents] GET error:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo documentos' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      if (!canManageDocumentChecklist(access.actor.role, access.actor.allRoles)) {
        return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
      }
      const body = await request.json();
      const category = String(body.category || 'otro') as DocumentCategory;
      const description = String(body.description || '').trim();
      if (!description) {
        return NextResponse.json({ success: false, error: 'Indique el nombre del documento requerido' }, { status: 400 });
      }
      if (!DOCUMENT_CATEGORIES.includes(category)) {
        return NextResponse.json({ success: false, error: 'Categoría no válida' }, { status: 400 });
      }
      const placeholder = await caseDocument.createCaseDocument({
        caseId: id,
        category,
        status: 'no_recibido',
        isRequired: true,
        description,
        uploadedById: actorUserReference(access.actor),
        uploadedByName: access.actor.displayName,
      });
      logCaseEvent({
        caseId: id,
        eventType: 'document_uploaded',
        description: `Documento requerido creado en el checklist: "${description}"`,
        userId: access.actor.userId,
        userName: access.actor.displayName,
      });
      triggerEvent('document:created', { caseId: id });
      return NextResponse.json({ success: true, data: placeholder }, { status: 201 });
    }

    if (!access.actor.allRoles && !['comercial_juridico', 'cliente'].includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get('file');
    const targetDocumentId = String(form.get('documentId') || '');
    const isClientUpload = access.actor.role === 'cliente';
    const category = (isClientUpload ? 'soporte_tecnico' : String(form.get('category') || 'otro')) as DocumentCategory;
    const description = String(form.get('description') || '');
    const isVisibleToClient = isClientUpload || form.get('isVisibleToClient') === 'true';

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Archivo requerido' }, { status: 400 });
    }
    if (!DOCUMENT_CATEGORIES.includes(category)) {
      return NextResponse.json({ success: false, error: 'Categoría no válida' }, { status: 400 });
    }
    if (file.size > CASE_DOCUMENT_MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: `El archivo excede ${CASE_DOCUMENT_MAX_SIZE_MB} MB` },
        { status: 400 },
      );
    }
    if (targetDocumentId) {
      const targetDocument = await caseDocument.getCaseDocumentById(targetDocumentId);
      const targetCaseId = await caseDocument.getCaseDocumentCaseId(targetDocumentId);
      if (!targetDocument || targetCaseId !== id) {
        return NextResponse.json({ success: false, error: 'Documento requerido no encontrado' }, { status: 404 });
      }
      if (isClientUpload && (!targetDocument.isRequired || !targetDocument.isVisibleToClient)) {
        return NextResponse.json({ success: false, error: 'Documento requerido no encontrado' }, { status: 404 });
      }
    }

    const asset = await uploadFile(
      Buffer.from(await file.arrayBuffer()),
      file.name,
      file.type || 'application/octet-stream',
    );
    const stored = targetDocumentId
      ? await caseDocument.updateCaseDocument(targetDocumentId, {
          status: 'recibido', fileUrl: asset.url, fileAssetId: asset.assetId,
          fileName: file.name, mimeType: file.type, fileSize: file.size,
          uploadedById: actorUserReference(access.actor), uploadedByName: access.actor.displayName,
        })
      : await caseDocument.createCaseDocument({
          caseId: id, category, status: 'recibido', fileName: file.name,
          fileSize: file.size, mimeType: file.type, fileUrl: asset.url,
          fileAssetId: asset.assetId, version: 1, isVisibleToClient,
          description, uploadedById: actorUserReference(access.actor),
          uploadedByName: access.actor.displayName,
        });

    const categoryLabel = DOCUMENT_CATEGORY_LABELS[category] || category;
    logCaseEvent({
      caseId: id,
      eventType: 'document_uploaded',
      description: `Documento recibido: "${file.name}" (${categoryLabel})`,
      userId: access.actor.userId,
      userName: access.actor.displayName,
    });
    triggerEvent('document:created', { caseId: id });
    return NextResponse.json({
      success: true,
      data: stored && safeDocument(stored, isClientUpload),
    }, { status: targetDocumentId ? 200 : 201 });
  } catch (error) {
    console.error('[case-documents] POST error:', error);
    return NextResponse.json({ success: false, error: 'Error subiendo documento' }, { status: 500 });
  }
}
