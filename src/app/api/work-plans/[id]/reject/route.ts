import { NextRequest, NextResponse } from 'next/server';
import { workPlan } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { canReviewWorkPlan } from '@/lib/auth/permissions';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { notifyUsersAndAdmins } from '@/lib/notify';
import type { WorkPlan } from '@/lib/types';

type WorkPlanWithCase = WorkPlan & { case?: { _id: string; caseCode: string; title: string } };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const rejectionComments = String(body.rejectionComments || '').trim();
    const caseId = await workPlan.getWorkPlanCaseId(id);
    if (!caseId) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;
    if (!canReviewWorkPlan(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    if (rejectionComments.length < 5 || rejectionComments.length > 2000) {
      return NextResponse.json({ success: false, error: 'El comentario de rechazo debe tener entre 5 y 2000 caracteres' }, { status: 400 });
    }
    const existing = await workPlan.getWorkPlanById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    if (existing.status !== 'enviado' && existing.status !== 'en_revision') {
      return NextResponse.json({ success: false, error: 'Solo se pueden rechazar planes enviados' }, { status: 400 });
    }

    const updated = await workPlan.updateWorkPlan(id, { status: 'rechazado', rejectionComments });

    const wp = existing as WorkPlanWithCase;
    if (wp.case?._id) {
      const userId = access.actor.userId;
      const userName = access.actor.displayName;
      logCaseEvent({
        caseId: wp.case._id,
        eventType: 'other',
        description: `Plan de trabajo rechazado: ${rejectionComments}`,
        userId, userName,
      });
      notifyUsersAndAdmins({
        userIds: [wp.assignedExpert?._id, wp.createdBy?._id].filter((uid) => uid !== userId),
        type: 'warning',
        priority: 'alta',
        title: `Plan de Trabajo Rechazado: ${wp.case.caseCode}`,
        message: `El plan de trabajo del caso "${wp.case.title}" fue rechazado. Motivo: ${rejectionComments}`,
        linkUrl: `/crm/cases/${wp.case._id}`,
      }).catch((err) => console.error('[work-plan:reject] Error notificando:', err));
    }

    triggerEvent('work-plan:rejected', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error rechazando plan' }, { status: 500 });
  }
}
