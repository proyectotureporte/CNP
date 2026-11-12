import { NextRequest, NextResponse } from 'next/server';
import { caseDocument, query, queryOne } from '@/lib/db';
import { actorUserReference, requireCaseAccess } from '@/lib/auth/caseAccess';
import { uploadFile } from '@/lib/sanity/assets';
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, type CaseDocument, type DocumentCategory } from '@/lib/types';
import { canManageDocumentChecklist } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';
import { auditEntityChange } from '@/lib/audit';
import { notifyUsers } from '@/lib/notify';
import { validateDocumentFiles } from '@/lib/files/uploadLimits';

async function commercialIdForCase(caseId: string): Promise<string | null> {
  const row = await queryOne<{ commercialId: string | null }>(
    'SELECT commercial_id AS "commercialId" FROM cases WHERE id = $1',
    [caseId],
  );
  return row?.commercialId ?? null;
}

function safeDocument(item: CaseDocument, hideUploader: boolean): CaseDocument {
  const safe = { ...item };
  delete safe.fileUrl;
  if (item.fileName) safe.downloadUrl = `/api/documents/${item._id}/download`;
  if (item.fileName) safe.viewUrl = `/api/documents/${item._id}/download?inline=1`;
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
    if (category && !DOCUMENT_CATEGORIES.includes(category as DocumentCategory)) {
      return NextResponse.json({ success: false, error: 'Categoría no válida' }, { status: 400 });
    }

    if (access.actor.role === 'cliente' || access.actor.role === 'abogado') {
      // Los dictámenes se entregan únicamente desde deliverables tras aprobación.
      const documents = (await caseDocument.listClientVisibleDocuments(id))
        .filter((document) => document.category !== 'dictamen')
        .map((document) => safeDocument(document, true));
      return NextResponse.json({ success: true, data: documents });
    }

    if (!access.actor.allRoles && !['comercial_juridico', 'junta', 'perito_interno', 'perito'].includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const docs = await caseDocument.listCaseDocuments(id, category);
    const isExpert = access.actor.role === 'perito' || access.actor.role === 'perito_interno';
    const visibleDocs = isExpert
      ? docs.filter((document) => document.category !== 'comprobantes_pago')
      : docs;
    let data: CaseDocument[] = visibleDocs.map((document) =>
      safeDocument(document, isExpert),
    );

    // Los comprobantes del cliente son financieros; nunca se exponen al perito.
    if (!isExpert && (!category || category === 'comprobantes_pago')) {
      const receipts = await query<{
        _id: string; _createdAt: string; paymentNumber: number;
        fileName: string | null; fileSize: number | null; mimeType: string | null;
      }>(
        `SELECT id AS "_id", created_at AS "_createdAt", payment_number AS "paymentNumber",
           file_name AS "fileName", file_size AS "fileSize", mime_type AS "mimeType"
         FROM payment WHERE case_id = $1 AND file_url IS NOT NULL ORDER BY payment_number ASC`,
        [id],
      );
      const existing = new Set(docs.filter((document) => document.category === 'comprobantes_pago').map((document) => document.fileName));
      const virtual: CaseDocument[] = receipts
        .filter((payment) => !existing.has(`Justificante Pago ${payment.paymentNumber}`))
        .map((payment) => ({
          _id: `payment-receipt-${payment._id}`,
          _createdAt: payment._createdAt,
          category: 'comprobantes_pago',
          status: 'recibido',
          isRequired: false,
          fileName: payment.fileName || `Justificante Pago ${payment.paymentNumber}`,
          fileSize: payment.fileSize || 0,
          mimeType: payment.mimeType || 'application/octet-stream',
          version: 1,
          isVisibleToClient: true,
          description: `Justificante Pago ${payment.paymentNumber}`,
          downloadUrl: `/api/payments/${payment._id}/receipt-download`,
          viewUrl: `/api/payments/${payment._id}/receipt-download?inline=1`,
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
      const category = String(body.category || 'documentos_caso') as DocumentCategory;
      const description = String(body.description || '').trim();
      if (!description) {
        return NextResponse.json({ success: false, error: 'Indique el nombre del documento requerido' }, { status: 400 });
      }
      if (!DOCUMENT_CATEGORIES.includes(category)) {
        return NextResponse.json({ success: false, error: 'Categoría no válida' }, { status: 400 });
      }
      // Visible al cliente por defecto: un requerido existe para que el cliente lo aporte.
      const isVisibleToClient = body.isVisibleToClient !== false;
      const placeholder = await caseDocument.createCaseDocument({
        caseId: id,
        category,
        status: 'no_recibido',
        isRequired: true,
        isVisibleToClient,
        description,
        uploadedById: actorUserReference(access.actor),
        uploadedByName: access.actor.displayName,
      });
      logCaseEvent({
        caseId: id,
        eventType: 'document_requested',
        title: 'Documento solicitado',
        description: `Se solicitó el documento "${description}" (${DOCUMENT_CATEGORY_LABELS[category]})`,
        isVisibleToClient,
        userId: access.actor.userId,
        userName: access.actor.displayName,
        documentId: placeholder?._id ?? null,
      });
      if (placeholder) {
        auditEntityChange({
          request, action: 'create', entityType: 'case_document', entityId: placeholder._id, caseId: id,
          after: { requerido: description, category, isVisibleToClient },
        });
      }
      triggerEvent('document:created', { caseId: id });
      return NextResponse.json({ success: true, data: placeholder }, { status: 201 });
    }

    if (!access.actor.allRoles && !['comercial_juridico', 'cliente', 'abogado'].includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const form = await request.formData();
    const files = [...form.getAll('files'), ...form.getAll('file')]
      .filter((value): value is File => value instanceof File && value.size > 0);
    const targetDocumentId = String(form.get('documentId') || '');
    const isClientUpload = access.actor.role === 'cliente' || access.actor.role === 'abogado';
    const category = (isClientUpload ? 'documentos_caso' : String(form.get('category') || 'documentos_caso')) as DocumentCategory;
    const description = String(form.get('description') || '').trim();
    const isVisibleToClient = isClientUpload || form.get('isVisibleToClient') === 'true';

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'Archivo requerido' }, { status: 400 });
    }
    if (!DOCUMENT_CATEGORIES.includes(category)) {
      return NextResponse.json({ success: false, error: 'Categoría no válida' }, { status: 400 });
    }
    const validationError = validateDocumentFiles(files);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    let targetDocument: CaseDocument | null = null;
    if (targetDocumentId) {
      targetDocument = await caseDocument.getCaseDocumentById(targetDocumentId);
      const targetCaseId = await caseDocument.getCaseDocumentCaseId(targetDocumentId);
      if (!targetDocument || targetCaseId !== id || targetDocument.supersededAt) {
        return NextResponse.json({ success: false, error: 'Documento requerido no encontrado' }, { status: 404 });
      }
      if (isClientUpload && !targetDocument.isVisibleToClient) {
        return NextResponse.json({ success: false, error: 'Documento requerido no encontrado' }, { status: 404 });
      }
      if (isClientUpload && targetDocument.fileName && targetDocument.reviewStatus !== 'requiere_correccion') {
        return NextResponse.json({ success: false, error: 'Este documento ya fue recibido' }, { status: 409 });
      }
    }

    // Lo que carga el equipo queda aprobado; lo que carga el cliente entra a revisión.
    const reviewStatus = isClientUpload ? 'pendiente_revision' : 'aprobado';
    const uploadedById = actorUserReference(access.actor);
    const uploadedByName = access.actor.displayName;
    const stored: CaseDocument[] = [];

    for (const [index, file] of files.entries()) {
      const asset = await uploadFile(
        Buffer.from(await file.arrayBuffer()),
        file.name,
        file.type || 'application/octet-stream',
      );
      const mimeType = file.type || 'application/octet-stream';
      let saved: CaseDocument | null;
      if (targetDocument && index === 0 && targetDocument.fileName) {
        // Versión nueva de un documento devuelto: se conserva la anterior.
        saved = await caseDocument.createDocumentVersion(targetDocument, id, {
          fileUrl: asset.url, fileAssetId: asset.assetId, fileName: file.name, mimeType,
          fileSize: file.size, uploadedById, uploadedByName, reviewStatus,
        });
      } else if (targetDocument && index === 0) {
        saved = await caseDocument.updateCaseDocument(targetDocument._id, {
          status: 'recibido', fileUrl: asset.url, fileAssetId: asset.assetId,
          fileName: file.name, mimeType, fileSize: file.size,
          uploadedById, uploadedByName, uploadedAt: new Date().toISOString(),
          reviewStatus, reviewNote: null, reviewedById: null, reviewedByName: null, reviewedAt: null,
        });
      } else {
        saved = await caseDocument.createCaseDocument({
          caseId: id,
          category: targetDocument?.category ?? category,
          status: 'recibido', fileName: file.name,
          fileSize: file.size, mimeType, fileUrl: asset.url,
          fileAssetId: asset.assetId, version: 1,
          isVisibleToClient: targetDocument ? targetDocument.isVisibleToClient || isVisibleToClient : isVisibleToClient,
          description: description || (targetDocument?.description ?? null),
          uploadedById, uploadedByName, reviewStatus,
        });
      }
      if (saved) stored.push(saved);
    }

    const categoryLabel = DOCUMENT_CATEGORY_LABELS[targetDocument?.category ?? category] || category;
    const names = stored.map((item) => item.fileName).filter(Boolean).join(', ');
    logCaseEvent({
      caseId: id,
      eventType: 'document_uploaded',
      title: isClientUpload ? (access.actor.role === 'abogado' ? 'Documentación recibida del abogado' : 'Documentación recibida del cliente') : 'Documento agregado al expediente',
      description: isClientUpload
        ? `${access.actor.role === 'abogado' ? 'El abogado' : 'El cliente'} envió ${stored.length} archivo(s) desde su portal: ${names}`
        : `Documento recibido: ${names} (${categoryLabel})`,
      // La actuación solo es visible si el documento lo es: no revelar archivos internos.
      isVisibleToClient: isClientUpload || stored.some((item) => item.isVisibleToClient),
      userId: access.actor.userId,
      userName: access.actor.displayName,
      documentId: stored[0]?._id ?? null,
    });
    for (const item of stored) {
      auditEntityChange({
        request, action: 'create', entityType: 'case_document', entityId: item._id, caseId: id,
        after: {
          fileName: item.fileName, category: item.category, version: item.version,
          isVisibleToClient: item.isVisibleToClient, reviewStatus: item.reviewStatus,
          origen: access.actor.role === 'abogado' ? 'portal del abogado' : isClientUpload ? 'portal del cliente' : 'CRM',
        },
      });
    }
    if (isClientUpload) {
      notifyUsers({
        userIds: [access.row.assignedJuridicoId, await commercialIdForCase(id)],
        title: access.actor.role === 'abogado' ? 'El abogado cargó documentación' : 'El cliente cargó documentación',
        message: `${access.actor.displayName} envió ${stored.length} archivo(s) desde el portal: ${names}. Pendiente de revisión.`,
        linkUrl: `/crm/cases/${id}?tab=documents`,
        priority: 'alta',
      }).catch((err) => console.error('[case-documents] Error notificando carga del cliente:', err));
    }
    triggerEvent('document:created', { caseId: id });
    return NextResponse.json({
      success: true,
      data: stored.length === 1 ? safeDocument(stored[0], isClientUpload) : stored.map((item) => safeDocument(item, isClientUpload)),
      count: stored.length,
    }, { status: targetDocumentId ? 200 : 201 });
  } catch (error) {
    console.error('[case-documents] POST error:', error);
    return NextResponse.json({ success: false, error: 'Error subiendo documento' }, { status: 500 });
  }
}
