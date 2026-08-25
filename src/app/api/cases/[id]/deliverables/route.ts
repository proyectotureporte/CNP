import { NextRequest, NextResponse } from 'next/server';
import { deliverable } from '@/lib/db';
import { actorUserReference, requireCaseAccess } from '@/lib/auth/caseAccess';
import { uploadFile } from '@/lib/sanity/assets';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { notifyUsersAndAdmins } from '@/lib/notify';
import { triggerEvent } from '@/lib/realtime/server';
import type { Deliverable, DeliverablePhase } from '@/lib/types';

const PHASES: DeliverablePhase[] = ['marco_conceptual', 'desarrollo_tecnico', 'dictamen_final'];
const PHASE_NUMBER: Record<DeliverablePhase, number> = {
  marco_conceptual: 1,
  desarrollo_tecnico: 2,
  dictamen_final: 3,
};
const MAX_DICTAMEN_SIZE = 25 * 1024 * 1024;
const MAX_ANNEX_SIZE = 15 * 1024 * 1024;

function publicDeliverable(item: Deliverable, clientView: boolean): Deliverable {
  const safe = { ...item };
  delete safe.fileUrl;
  safe.downloadUrl = `/api/deliverables/${item._id}/download`;
  safe.attachments = (item.attachments || []).map((attachment) => ({
    ...attachment,
    downloadUrl: `/api/deliverable-attachments/${attachment._id}/download`,
  }));
  if (clientView) {
    if (!(item.phase === 'dictamen_final' && item.status === 'aprobado')) {
      delete safe.submittedBy;
    }
    delete safe.reviewedBy;
    delete safe.approvedBy;
    delete safe.rejectionReason;
    delete safe.comments;
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
    if (!access.actor.allRoles && !['comercial_juridico', 'perito_interno', 'perito', 'cliente'].includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    let items = await deliverable.listCaseDeliverables(id);
    if (access.actor.role === 'cliente') {
      items = items.filter((item) => item.status === 'aprobado');
    }
    return NextResponse.json({
      success: true,
      data: items.map((item) => publicDeliverable(item, access.actor.role === 'cliente')),
    });
  } catch (error) {
    console.error('[case-deliverables] GET error:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo entregas' }, { status: 500 });
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
    if (!access.actor.allRoles && !['perito', 'perito_interno'].includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Solo el perito asignado puede cargar el dictamen' }, { status: 403 });
    }

    const form = await request.formData();
    const requestedPhase = String(form.get('phase') || 'dictamen_final') as DeliverablePhase;
    const phase = requestedPhase;
    const dictamen = form.get('dictamen');
    const annexes = form.getAll('anexos').filter((item): item is File => item instanceof File && item.size > 0);
    const comments = String(form.get('comments') || '').trim();

    if (!PHASES.includes(phase)) {
      return NextResponse.json({ success: false, error: 'Fase inválida' }, { status: 400 });
    }
    if (!(dictamen instanceof File) || dictamen.size === 0) {
      return NextResponse.json({ success: false, error: 'Debes seleccionar el PDF del dictamen' }, { status: 400 });
    }
    if (dictamen.size > MAX_DICTAMEN_SIZE) {
      return NextResponse.json({ success: false, error: 'El dictamen supera 25 MB' }, { status: 400 });
    }
    if (dictamen.type !== 'application/pdf' && !dictamen.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ success: false, error: 'El dictamen debe ser un archivo PDF' }, { status: 400 });
    }
    if (annexes.length > 10 || annexes.some((file) => file.size > MAX_ANNEX_SIZE)) {
      return NextResponse.json({ success: false, error: 'Máximo 10 anexos de 15 MB cada uno' }, { status: 400 });
    }

    const mainAsset = await uploadFile(
      Buffer.from(await dictamen.arrayBuffer()),
      dictamen.name,
      dictamen.type || 'application/pdf',
    );
    const version = await deliverable.getNextDeliverableVersion(id, phase);
    const created = await deliverable.createDeliverable({
      caseId: id,
      phase,
      phaseNumber: PHASE_NUMBER[phase],
      fileUrl: mainAsset.url,
      fileAssetId: mainAsset.assetId,
      fileName: mainAsset.originalFilename || dictamen.name,
      mimeType: mainAsset.mimeType,
      fileSize: mainAsset.size,
      status: 'enviado',
      comments,
      version,
      submittedById: actorUserReference(access.actor),
    });
    if (!created) {
      return NextResponse.json({ success: false, error: 'No fue posible registrar la entrega' }, { status: 500 });
    }

    for (const annex of annexes) {
      const asset = await uploadFile(
        Buffer.from(await annex.arrayBuffer()),
        annex.name,
        annex.type || 'application/octet-stream',
      );
      await deliverable.addDeliverableAttachment({
        deliverableId: created._id,
        fileUrl: asset.url,
        fileAssetId: asset.assetId,
        fileName: asset.originalFilename || annex.name,
        mimeType: asset.mimeType,
        fileSize: asset.size,
      });
    }

    logCaseEvent({
      caseId: id,
      eventType: 'deliverable_submitted',
      description: `Dictamen enviado (versión ${version}, ${annexes.length} anexo${annexes.length === 1 ? '' : 's'})`,
      userId: access.actor.userId,
      userName: access.actor.displayName,
    });
    await notifyUsersAndAdmins({
      userIds: [access.row.assignedJuridicoId],
      type: 'info',
      priority: 'alta',
      title: 'Dictamen listo para revisión',
      message: `El perito cargó la versión ${version} del dictamen.`,
      linkUrl: `/crm/cases/${id}?tab=deliverables`,
    });
    triggerEvent('deliverable:created', { caseId: id });

    const refreshed = await deliverable.getDeliverableById(created._id);
    return NextResponse.json({ success: true, data: refreshed && publicDeliverable(refreshed, false) }, { status: 201 });
  } catch (error) {
    console.error('[case-deliverables] POST error:', error);
    return NextResponse.json({ success: false, error: 'Error cargando el dictamen' }, { status: 500 });
  }
}
