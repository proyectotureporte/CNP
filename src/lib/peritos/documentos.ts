import { NextResponse } from 'next/server';
import { expert } from '@/lib/db';
import { uploadFile, deleteAsset } from '@/lib/sanity/assets';
import { proxyStoredAsset } from '@/lib/files/proxyStoredAsset';
import {
  EXPERT_DOCUMENT_MAX_BYTES,
  EXPERT_DOCUMENT_TYPES,
  type ExpertDocumentType,
} from '@/lib/types';

/**
 * Lógica compartida de la documentación del perito, usada por el CRM
 * (/api/experts/[id]/documents) y por el propio perito (/api/expert/profile/documents).
 * `baseUrl` es la ruta de descarga de cada consumidor; la URL persistente de
 * Sanity nunca sale del servidor.
 */
export async function listDocumentsResponse(expertId: string, baseUrl: string) {
  const [cv, documents] = await Promise.all([
    expert.getExpertCvAsset(expertId),
    expert.listExpertDocuments(expertId),
  ]);
  return NextResponse.json({
    success: true,
    data: {
      cv: cv?.fileUrl
        ? {
            fileName: cv.fileName,
            mimeType: cv.mimeType,
            fileSize: cv.fileSize,
            downloadUrl: `${baseUrl}/cv`,
            viewUrl: `${baseUrl}/cv?inline=1`,
          }
        : null,
      documents: documents.map((document) => ({
        ...document,
        downloadUrl: `${baseUrl}/${document._id}`,
        viewUrl: `${baseUrl}/${document._id}?inline=1`,
      })),
    },
  });
}

export async function uploadDocumentFromForm(
  expertId: string,
  form: FormData,
  uploadedById: string | null,
): Promise<NextResponse> {
  const docType = String(form.get('docType') || '') as ExpertDocumentType;
  const file = form.get('file');
  if (!EXPERT_DOCUMENT_TYPES.includes(docType)) {
    return NextResponse.json({ success: false, error: 'Tipo de documento inválido' }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ success: false, error: 'Selecciona un archivo' }, { status: 400 });
  }
  if (file.size > EXPERT_DOCUMENT_MAX_BYTES) {
    return NextResponse.json({ success: false, error: `"${file.name}" supera el máximo de 50 MB` }, { status: 400 });
  }
  const asset = await uploadFile(
    Buffer.from(await file.arrayBuffer()),
    file.name,
    file.type || 'application/octet-stream',
  );
  const id = await expert.addExpertDocument({
    expertId,
    docType,
    fileUrl: asset.url,
    fileAssetId: asset.assetId,
    fileName: asset.originalFilename || file.name,
    mimeType: asset.mimeType,
    fileSize: asset.size ?? file.size,
    uploadedById,
  });
  return NextResponse.json({ success: true, data: { id } }, { status: 201 });
}

const notFound = () => NextResponse.json({ success: false, error: 'Archivo no encontrado' }, { status: 404 });

/** docId `cv` es la hoja de vida (expert.cv_file_*); el resto, filas de documentos. */
export async function downloadDocument(expertId: string, docId: string, inline: boolean) {
  if (docId === 'cv') {
    const cv = await expert.getExpertCvAsset(expertId);
    if (!cv?.fileUrl) return notFound();
    return proxyStoredAsset(cv, { inline });
  }
  const document = await expert.getExpertDocumentAsset(docId);
  if (!document || document.expertId !== expertId) return notFound();
  return proxyStoredAsset(document, { inline });
}

export async function removeDocument(expertId: string, docId: string) {
  if (docId === 'cv') {
    const cv = await expert.getExpertCvAsset(expertId);
    if (!cv?.fileUrl) return notFound();
    await expert.clearExpertCv(expertId);
    if (cv.fileAssetId) await deleteAsset(cv.fileAssetId);
    return NextResponse.json({ success: true });
  }
  const document = await expert.getExpertDocumentAsset(docId);
  if (!document || document.expertId !== expertId) return notFound();
  await expert.deleteExpertDocument(docId);
  if (document.fileAssetId) await deleteAsset(document.fileAssetId);
  return NextResponse.json({ success: true });
}
