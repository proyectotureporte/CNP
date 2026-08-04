import { NextRequest, NextResponse } from 'next/server';
import { workPlanActivity } from '@/lib/db';
import { uploadFile } from '@/lib/sanity/assets';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';
import { canEditWorkPlan } from '@/lib/auth/permissions';
import { requireCaseAccess } from '@/lib/auth/caseAccess';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await workPlanActivity.getActivityById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Actividad no encontrada' }, { status: 404 });
    }
    const context = await workPlanActivity.getActivityContext(id);
    if (!context) return NextResponse.json({ success: false, error: 'Actividad no encontrada' }, { status: 404 });
    const access = await requireCaseAccess(request, context.caseId);
    if (access.response) return access.response;
    if (!canEditWorkPlan(access.actor.role)) return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    if (access.actor.role === 'perito'
      && !['borrador', 'rechazado', 'aprobado'].includes(context.workPlanStatus || '')) {
      return NextResponse.json(
        { success: false, error: 'No puedes cambiar evidencias mientras el plan está en revisión' },
        { status: 409 },
      );
    }
    const userId = access.actor.userId;
    const userName = access.actor.displayName;

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

    logCaseEvent({
      caseId: context.caseId,
      eventType: 'document_uploaded',
      description: `Documento subido en actividad "${existing.title}": ${file.name}`,
      userId, userName,
    });

    triggerEvent('activity:updated', { id });

    return NextResponse.json({
      success: true,
      data: { downloadUrl: `/api/activities/${id}/download` },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error subiendo archivo' }, { status: 500 });
  }
}
