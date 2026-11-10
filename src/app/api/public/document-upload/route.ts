import { NextRequest, NextResponse } from 'next/server';
import { caseDocument, documentUploadLink } from '@/lib/db';
import { uploadFile } from '@/lib/sanity/assets';
import { notifyUsers } from '@/lib/notify';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';
import {
  CASE_DOCUMENT_MAX_SIZE_BYTES,
  CASE_DOCUMENT_MAX_SIZE_MB,
  validateDocumentFiles,
} from '@/lib/files/uploadLimits';
import { auditEntityChange } from '@/lib/audit';
import {
  DOCUMENT_UPLOAD_COOKIE,
  parseDocumentUploadCredential,
} from '@/lib/files/documentUploadToken';

async function resolveLink(request: NextRequest) {
  const credential = request.cookies.get(DOCUMENT_UPLOAD_COOKIE)?.value;
  const parsed = parseDocumentUploadCredential(credential);
  return parsed
    ? documentUploadLink.getValidLink(parsed.id, parsed.tokenHash)
    : null;
}

function invalidLinkResponse() {
  const response = NextResponse.json(
    { success: false, error: 'El enlace no es válido, fue revocado o ya venció' },
    { status: 401 },
  );
  response.cookies.delete(DOCUMENT_UPLOAD_COOKIE);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const link = await resolveLink(request);
    if (!link) return invalidLinkResponse();
    const context = await documentUploadLink.getPublicContext(link);
    const response = NextResponse.json({ success: true, data: context });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('[public-document-upload] GET error:', error);
    return NextResponse.json({ success: false, error: 'No fue posible abrir la solicitud' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
      : request.nextUrl.origin;
    if (origin && origin !== configuredOrigin) {
      return NextResponse.json({ success: false, error: 'Origen no permitido' }, { status: 403 });
    }

    const link = await resolveLink(request);
    if (!link) return invalidLinkResponse();

    const form = await request.formData();
    const files = form.getAll('files').filter((value): value is File => value instanceof File && value.size > 0);
    const targetDocumentId = String(form.get('documentId') || '');
    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'Selecciona al menos un archivo' }, { status: 400 });
    }
    if (files.length > 10) {
      return NextResponse.json({ success: false, error: 'Puedes enviar máximo 10 archivos a la vez' }, { status: 400 });
    }
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > CASE_DOCUMENT_MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: `El envío completo excede el límite de ${CASE_DOCUMENT_MAX_SIZE_MB} MB` },
        { status: 400 },
      );
    }
    const validationError = validateDocumentFiles(files);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const target = targetDocumentId
      ? await caseDocument.getCaseDocumentById(targetDocumentId)
      : null;
    if (targetDocumentId) {
      const targetCaseId = await caseDocument.getCaseDocumentCaseId(targetDocumentId);
      if (!target || targetCaseId !== link.caseId || !target.isVisibleToClient || target.supersededAt) {
        return NextResponse.json({ success: false, error: 'La solicitud documental no existe' }, { status: 404 });
      }
      // Solo se acepta sobre un requerido sin archivo o sobre una versión devuelta.
      const isCorrection = target.reviewStatus === 'requiere_correccion';
      if (!isCorrection && (!target.isRequired || target.status === 'recibido' || target.fileName)) {
        return NextResponse.json({ success: false, error: 'Este documento ya fue recibido' }, { status: 409 });
      }
    }

    const uploadedByName = `Cliente: ${link.clientName} · enlace seguro`;
    const storedNames: string[] = [];
    const storedIds: string[] = [];
    for (const [index, file] of files.entries()) {
      const asset = await uploadFile(
        Buffer.from(await file.arrayBuffer()),
        file.name,
        file.type || 'application/octet-stream',
      );
      const uploadedAt = new Date().toISOString();
      const mimeType = file.type || 'application/octet-stream';
      let saved: { _id: string } | null = null;
      if (target && index === 0 && target.reviewStatus === 'requiere_correccion') {
        // Versión corregida: la anterior se conserva con su observación.
        saved = await caseDocument.createDocumentVersion(target, link.caseId, {
          fileUrl: asset.url, fileAssetId: asset.assetId, fileName: file.name, mimeType,
          fileSize: file.size, uploadedById: null, uploadedByName, uploadLinkId: link.id,
          reviewStatus: 'pendiente_revision', isVisibleToClient: true,
        });
      } else if (target && index === 0) {
        saved = await caseDocument.updateCaseDocument(target._id, {
          status: 'recibido',
          isVisibleToClient: true,
          fileUrl: asset.url,
          fileAssetId: asset.assetId,
          fileName: file.name,
          mimeType,
          fileSize: file.size,
          uploadedById: null,
          uploadedByName,
          uploadedAt,
          uploadLinkId: link.id,
          reviewStatus: 'pendiente_revision',
          reviewNote: null, reviewedById: null, reviewedByName: null, reviewedAt: null,
        });
      } else {
        saved = await caseDocument.createCaseDocument({
          caseId: link.caseId,
          category: target?.category ?? 'documentos_caso',
          status: 'recibido',
          isRequired: false,
          isVisibleToClient: true,
          description: target?.description || 'Documento enviado por el cliente',
          fileUrl: asset.url,
          fileAssetId: asset.assetId,
          fileName: file.name,
          mimeType,
          fileSize: file.size,
          uploadedById: null,
          uploadedByName,
          uploadedAt,
          uploadLinkId: link.id,
          reviewStatus: 'pendiente_revision',
        });
      }
      storedNames.push(file.name);
      if (saved) storedIds.push(saved._id);
    }

    await documentUploadLink.recordUploads(link.id, storedNames.length);
    await logCaseEvent({
      caseId: link.caseId,
      eventType: 'document_uploaded',
      title: 'Documentación recibida del cliente',
      description: `${link.clientName} cargó ${storedNames.length} archivo(s) mediante el enlace seguro: ${storedNames.join(', ')}`,
      userName: uploadedByName,
      documentId: storedIds[0] ?? null,
    });
    for (const [index, documentId] of storedIds.entries()) {
      auditEntityChange({
        request: null, action: 'create', entityType: 'case_document', entityId: documentId, caseId: link.caseId,
        actorLabel: uploadedByName,
        after: { fileName: storedNames[index], origen: 'enlace seguro', reviewStatus: 'pendiente_revision' },
      });
    }
    await notifyUsers({
      userIds: [link.assignedJuridicoId, link.commercialId],
      title: 'El cliente cargó documentación',
      message: `${link.clientName} envió ${storedNames.length} archivo(s) para el caso ${link.caseCode}. Pendiente de revisión.`,
      linkUrl: `/crm/cases/${link.caseId}?tab=documents`,
      priority: 'alta',
    });
    triggerEvent('document:created', { caseId: link.caseId });

    const response = NextResponse.json({
      success: true,
      data: { count: storedNames.length, fileNames: storedNames },
    }, { status: 201 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('[public-document-upload] POST error:', error);
    return NextResponse.json({ success: false, error: 'No fue posible cargar los archivos' }, { status: 500 });
  }
}
