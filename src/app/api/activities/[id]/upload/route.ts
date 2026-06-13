import { NextRequest, NextResponse } from 'next/server';
import { workPlanActivity } from '@/lib/db';
import { uploadFile } from '@/lib/sanity/assets';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';
import { guardRole } from '@/lib/auth/guard';
import { canManageWorkPlanActions } from '@/lib/auth/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canManageWorkPlanActions);
    if (stop) return stop;

    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');

    const existing = await workPlanActivity.getActivityById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Actividad no encontrada' }, { status: 404 });
    }
    const caseId = await workPlanActivity.getActivityCaseId(id);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Archivo requerido' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'El archivo excede el limite de 10MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await uploadFile(buffer, file.name, file.type);

    await workPlanActivity.updateActivity(id, {
      fileUrl: asset.url,
      fileAssetId: asset.assetId,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    });

    if (caseId) {
      logCaseEvent({
        caseId,
        eventType: 'document_uploaded',
        description: `Documento subido en actividad "${existing.title}": ${file.name}`,
        userId, userName,
      });
    }

    triggerEvent('activity:updated', { id });

    return NextResponse.json({ success: true, data: { fileUrl: asset.url } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error subiendo archivo' }, { status: 500 });
  }
}
