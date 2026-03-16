import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getWhatsappLeadByIdQuery } from '@/lib/sanity/queries';
import type { WhatsappLead } from '@/lib/types';

// Transfer lead documents to a case as caseDocuments
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

    const lead = await client.fetch<WhatsappLead | null>(getWhatsappLeadByIdQuery, { id });
    if (!lead || !lead.documents?.length) {
      return NextResponse.json({ success: true, data: { transferred: 0 } });
    }

    let transferred = 0;

    for (const doc of lead.documents) {
      if (!doc.fileUrl) continue;

      // Download the file from Sanity CDN and re-upload as a case document
      // Actually, we can reference the same asset directly
      const fileAssetRef = (doc as unknown as { file?: { asset?: { _ref?: string } } }).file;

      if (fileAssetRef?.asset?._ref) {
        await writeClient.create({
          _type: 'caseDocument',
          case: { _type: 'reference', _ref: caseId },
          category: 'soporte_tecnico',
          fileName: doc.fileName || 'documento',
          fileSize: 0,
          mimeType: doc.mimeType || 'application/octet-stream',
          version: 1,
          isVisibleToClient: true,
          description: 'Documento recibido por WhatsApp',
          uploadedByName: userName,
          ...(userId ? { uploadedBy: { _type: 'reference', _ref: userId } } : {}),
          file: { _type: 'file', asset: { _type: 'reference', _ref: fileAssetRef.asset._ref } },
        });
        transferred++;
      }
    }

    return NextResponse.json({ success: true, data: { transferred } });
  } catch (err) {
    console.error('[whatsapp/leads/id/documents-to-case] POST error:', err);
    return NextResponse.json({ success: false, error: 'Error transfiriendo documentos' }, { status: 500 });
  }
}
