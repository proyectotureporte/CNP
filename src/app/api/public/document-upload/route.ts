import { NextRequest, NextResponse } from 'next/server';
import { caseDocument, documentUploadLink } from '@/lib/db';
import { uploadFile } from '@/lib/sanity/assets';
import { notifyUsers } from '@/lib/notify';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';
import {
  CASE_DOCUMENT_MAX_SIZE_BYTES,
  CASE_DOCUMENT_MAX_SIZE_MB,
} from '@/lib/files/uploadLimits';
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
    const oversized = files.find((file) => file.size > CASE_DOCUMENT_MAX_SIZE_BYTES);
    if (oversized) {
      return NextResponse.json(
        { success: false, error: `${oversized.name} excede el límite de ${CASE_DOCUMENT_MAX_SIZE_MB} MB` },
        { status: 400 },
      );
    }

    const target = targetDocumentId
      ? await caseDocument.getCaseDocumentById(targetDocumentId)
      : null;
    if (targetDocumentId) {
      const targetCaseId = await caseDocument.getCaseDocumentCaseId(targetDocumentId);
      if (!target || targetCaseId !== link.caseId || !target.isRequired || !target.isVisibleToClient) {
        return NextResponse.json({ success: false, error: 'La solicitud documental no existe' }, { status: 404 });
      }
      if (target.status === 'recibido') {
        return NextResponse.json({ success: false, error: 'Este documento ya fue recibido' }, { status: 409 });
      }
    }

    const uploadedByName = `Cliente: ${link.clientName} · enlace seguro`;
    const storedNames: string[] = [];
    for (const [index, file] of files.entries()) {
      const asset = await uploadFile(
        Buffer.from(await file.arrayBuffer()),
        file.name,
        file.type || 'application/octet-stream',
      );
      const uploadedAt = new Date().toISOString();
      if (target && index === 0) {
        await caseDocument.updateCaseDocument(target._id, {
          status: 'recibido',
          isVisibleToClient: true,
          fileUrl: asset.url,
          fileAssetId: asset.assetId,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size,
          uploadedById: null,
          uploadedByName,
          uploadedAt,
          uploadLinkId: link.id,
        });
      } else {
        await caseDocument.createCaseDocument({
          caseId: link.caseId,
          category: target?.category ?? 'documentos_caso',
          status: 'recibido',
          isRequired: false,
          isVisibleToClient: true,
          description: target?.description || 'Documento enviado por el cliente',
          fileUrl: asset.url,
          fileAssetId: asset.assetId,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size,
          uploadedById: null,
          uploadedByName,
          uploadedAt,
          uploadLinkId: link.id,
        });
      }
      storedNames.push(file.name);
    }

    await documentUploadLink.recordUploads(link.id, storedNames.length);
    await logCaseEvent({
      caseId: link.caseId,
      eventType: 'document_uploaded',
      description: `${link.clientName} cargó ${storedNames.length} archivo(s) mediante el enlace seguro: ${storedNames.join(', ')}`,
      userName: uploadedByName,
    });
    await notifyUsers({
      userIds: [link.assignedJuridicoId, link.commercialId],
      title: 'El cliente cargó documentación',
      message: `${link.clientName} envió ${storedNames.length} archivo(s) para el caso ${link.caseCode}.`,
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
