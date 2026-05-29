import { NextRequest, NextResponse } from 'next/server';
import { caseDocument, query } from '@/lib/db';

// Transfer lead documents to a case as caseDocuments (same Sanity asset, referenced by URL)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { caseId } = body;

    if (!caseId) {
      return NextResponse.json({ success: false, error: 'caseId requerido' }, { status: 400 });
    }

    const userName = request.headers.get('x-user-name') || 'Sistema';
    const userId = request.headers.get('x-user-id') || '';

    const docs = await query<{
      file_url: string | null; file_asset_id: string | null;
      file_name: string | null; mime_type: string | null; file_size: number | null;
    }>(
      `SELECT file_url, file_asset_id, file_name, mime_type, file_size
       FROM whatsapp_lead_document WHERE lead_id = $1 ORDER BY sort_order`,
      [id]
    );

    let transferred = 0;
    for (const doc of docs) {
      if (!doc.file_asset_id) continue;
      await caseDocument.createCaseDocument({
        caseId,
        category: 'soporte_tecnico',
        fileName: doc.file_name || 'documento',
        fileSize: doc.file_size || 0,
        mimeType: doc.mime_type || 'application/octet-stream',
        fileUrl: doc.file_url,
        fileAssetId: doc.file_asset_id,
        version: 1,
        isVisibleToClient: true,
        description: 'Documento recibido por WhatsApp',
        uploadedById: userId && userId !== 'admin' ? userId : null,
        uploadedByName: userName,
      });
      transferred++;
    }

    return NextResponse.json({ success: true, data: { transferred } });
  } catch (err) {
    console.error('[whatsapp/leads/id/documents-to-case] POST error:', err);
    return NextResponse.json({ success: false, error: 'Error transfiriendo documentos' }, { status: 500 });
  }
}
