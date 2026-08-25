import { NextRequest, NextResponse } from 'next/server';
import { workPlan } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { canEditWorkPlan } from '@/lib/auth/permissions';
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

    const caseId = await workPlan.getWorkPlanCaseId(id);
    if (!caseId) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;
    if (!canEditWorkPlan(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    const existing = await workPlan.getWorkPlanById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    if (existing.status !== 'borrador' && existing.status !== 'rechazado') {
      return NextResponse.json({ success: false, error: 'Solo se pueden enviar planes en borrador' }, { status: 400 });
    }
    if (!existing.methodology?.trim() || !existing.objectives?.trim() || !existing.deliverablesDescription?.trim()) {
      return NextResponse.json({ success: false, error: 'Completa metodología, objetivos y entregables antes de enviar' }, { status: 400 });
    }

    const updated = await workPlan.updateWorkPlan(id, { status: 'enviado', submittedAt: new Date().toISOString() });

    const wp = existing as WorkPlanWithCase;
    if (wp.case?._id) {
      const userId = access.actor.userId;
      const userName = access.actor.displayName;
      logCaseEvent({
        caseId: wp.case._id,
        eventType: 'other',
        description: 'Plan de trabajo enviado a revisión del Comercial Jurídico',
        userId, userName,
      });
      notifyUsersAndAdmins({
        userIds: [access.row.assignedJuridicoId],
        type: 'info',
        priority: 'normal',
        title: `Plan de Trabajo por Revisar: ${wp.case.caseCode}`,
        message: `El plan de trabajo del caso "${wp.case.title}" fue enviado y espera revisión del Comercial Jurídico.`,
        linkUrl: `/crm/work-plans`,
      }).catch((err) => console.error('[work-plan:submit] Error notificando:', err));
    }

    triggerEvent('work-plan:submitted', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error enviando plan' }, { status: 500 });
  }
}
