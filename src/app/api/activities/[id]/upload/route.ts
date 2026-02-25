import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { logCaseEvent } from '@/lib/sanity/logEvent';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');

    const existing = await client.fetch(
      `*[_type == "workPlanActivity" && _id == $id][0]{ _id, title, "caseId": case._ref }`,
      { id }
    );
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Actividad no encontrada' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Archivo requerido' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'El archivo excede el limite de 10MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await writeClient.assets.upload('file', buffer, {
      filename: file.name,
      contentType: file.type,
    });

    await writeClient.patch(id).set({
      file: {
        _type: 'file',
        asset: { _type: 'reference', _ref: asset._id },
      },
    }).commit();

    if (existing.caseId) {
      logCaseEvent({
        caseId: existing.caseId,
        eventType: 'document_uploaded',
        description: `Documento subido en actividad "${existing.title}": ${file.name}`,
        userId, userName,
      });
    }

    return NextResponse.json({ success: true, data: { fileUrl: asset.url } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error subiendo archivo' }, { status: 500 });
  }
}
