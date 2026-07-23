import { NextRequest, NextResponse } from 'next/server';
import { cases, caseDocument, query } from '@/lib/db';
import { uploadFile } from '@/lib/sanity/assets';
import { verifyClientOwnsCase } from '@/lib/auth/clientAccess';
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from '@/lib/types';
import { guardRole } from '@/lib/auth/guard';
import { canManageDocumentChecklist } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userRole = request.headers.get('x-user-role') || '';
    const userId = request.headers.get('x-user-id') || '';
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';

    // Portal clients: verify ownership and only return visible documents
    if (userRole === 'cliente') {
      const { owns } = await verifyClientOwnsCase(userId, id);
      if (!owns) {
        return NextResponse.json({ success: false, error: 'No tiene acceso a este caso' }, { status: 403 });
      }
      const documents = await caseDocument.listClientVisibleDocuments(id);
      return NextResponse.json({ success: true, data: documents });
    }

    const docs = await caseDocument.listCaseDocuments(id, category);
    let data: unknown[] = docs;

    // Also surface payment receipts as virtual "pago" documents
    if (!category || category === 'pago') {
      const receipts = await query<{
        _id: string; _createdAt: string; paymentNumber: number;
        fileUrl: string; fileSize: number | null; mimeType: string | null;
      }>(
        `SELECT id AS "_id", created_at AS "_createdAt", payment_number AS "paymentNumber",
           file_url AS "fileUrl", file_size AS "fileSize", mime_type AS "mimeType"
         FROM payment WHERE case_id = $1 AND file_url IS NOT NULL ORDER BY payment_number ASC`,
        [id]
      );

      const existing = new Set(docs.filter((d) => d.category === 'pago').map((d) => d.fileName));
      const virtual = receipts
        .filter((p) => !existing.has(`Justificante Pago ${p.paymentNumber}`))
        .map((p) => ({
          _id: `payment-receipt-${p._id}`,
          _createdAt: p._createdAt,
          category: 'pago',
          fileName: `Justificante Pago ${p.paymentNumber}`,
          fileSize: p.fileSize || 0,
          mimeType: p.mimeType || 'application/octet-stream',
          version: 1,
          isVisibleToClient: true,
          description: `Justificante Pago ${p.paymentNumber}`,
          fileUrl: p.fileUrl,
          uploadedByName: 'Sistema',
        }));

      data = [...docs, ...virtual];
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo documentos' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const userRole = request.headers.get('x-user-role') || '';

    if (userRole === 'cliente') {
      const { owns } = await verifyClientOwnsCase(userId || '', id);
      if (!owns) {
        return NextResponse.json({ success: false, error: 'No tiene acceso a este caso' }, { status: 403 });
      }
    }

    const existing = await cases.getCaseById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    // Checklist documental (RF-05): con JSON se crea un documento REQUERIDO
    // pendiente (placeholder sin archivo, estado "no_recibido").
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const stop = guardRole(request, canManageDocumentChecklist);
      if (stop) return stop;

      const body = await request.json();
      const reqCategory = (body.category as string) || 'otro';
      const reqName = (body.description as string) || '';
      if (!reqName.trim()) {
        return NextResponse.json(
          { success: false, error: 'Indique el nombre del documento requerido' },
          { status: 400 }
        );
      }
      if (!DOCUMENT_CATEGORIES.includes(reqCategory as DocumentCategory)) {
        return NextResponse.json({ success: false, error: 'Categoria no valida' }, { status: 400 });
      }

      const placeholder = await caseDocument.createCaseDocument({
        caseId: id,
        category: reqCategory as DocumentCategory,
        status: 'no_recibido',
        isRequired: true,
        description: reqName.trim(),
        uploadedById: userId && userId !== 'admin' ? userId : null,
        uploadedByName: userName || 'Sistema',
      });

      logCaseEvent({
        caseId: id,
        eventType: 'document_uploaded',
        description: `Documento requerido creado en el checklist: "${reqName.trim()}"`,
        userId, userName,
      });
      triggerEvent('document:created', { caseId: id });
      return NextResponse.json({ success: true, data: placeholder }, { status: 201 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const targetDocumentId = (formData.get('documentId') as string) || '';

    const isClientUpload = userRole === 'cliente';
    const category = isClientUpload ? 'soporte_tecnico' : ((formData.get('category') as string) || 'otro');
    const description = (formData.get('description') as string) || '';
    const isVisibleToClient = isClientUpload ? true : formData.get('isVisibleToClient') === 'true';

    if (!file) {
      return NextResponse.json({ success: false, error: 'Archivo requerido' }, { status: 400 });
    }
    if (!DOCUMENT_CATEGORIES.includes(category as DocumentCategory)) {
      return NextResponse.json({ success: false, error: 'Categoria no valida' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'El archivo excede el limite de 10MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await uploadFile(buffer, file.name, file.type);

    // Subida sobre un requerido del checklist: completa el placeholder y lo marca recibido.
    if (targetDocumentId && !isClientUpload) {
      const target = await caseDocument.getCaseDocumentById(targetDocumentId);
      if (!target) {
        return NextResponse.json({ success: false, error: 'Documento requerido no encontrado' }, { status: 404 });
      }
      const updated = await caseDocument.updateCaseDocument(targetDocumentId, {
        status: 'recibido',
        fileUrl: asset.url,
        fileAssetId: asset.assetId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        uploadedById: userId ?? undefined,
        uploadedByName: userName || 'Sistema',
      });
      logCaseEvent({
        caseId: id,
        eventType: 'document_uploaded',
        description: `Documento requerido recibido: "${target.description || file.name}"`,
        userId, userName,
      });
      triggerEvent('document:created', { caseId: id });
      return NextResponse.json({ success: true, data: updated }, { status: 200 });
    }

    const created = await caseDocument.createCaseDocument({
      caseId: id,
      category: category as DocumentCategory,
      status: 'recibido',
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      fileUrl: asset.url,
      fileAssetId: asset.assetId,
      version: 1,
      isVisibleToClient,
      description,
      uploadedById: userId && userId !== 'admin' ? userId : null,
      uploadedByName: userName || 'Sistema',
    });

    const catLabel = DOCUMENT_CATEGORY_LABELS[category as DocumentCategory] || category;
    logCaseEvent({
      caseId: id,
      eventType: 'document_uploaded',
      description: `Documento subido: "${file.name}" (${catLabel})`,
      userId, userName,
    });

    triggerEvent('document:created', { caseId: id });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error subiendo documento' }, { status: 500 });
  }
}
