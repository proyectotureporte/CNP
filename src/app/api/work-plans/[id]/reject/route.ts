import { NextRequest, NextResponse } from 'next/server';
import { workPlan } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { guardRole } from '@/lib/auth/guard';
import { canManageWorkPlanActions } from '@/lib/auth/permissions';
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

    const stop = guardRole(request, canManageWorkPlanActions);
    if (stop) return stop;

    const body = await request.json();
    if (!body.rejectionComments) {
      return NextResponse.json({ success: false, error: 'Comentarios de rechazo requeridos' }, { status: 400 });
    }
    const existing = await workPlan.getWorkPlanById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });

    const updated = await workPlan.updateWorkPlan(id, { status: 'rechazado', rejectionComments: body.rejectionComments });

    const wp = existing as WorkPlanWithCase;
    if (wp.case?._id) {
      const userId = request.headers.get('x-user-id');
      const userName = request.headers.get('x-user-name');
      logCaseEvent({
        caseId: wp.case._id,
        eventType: 'other',
        description: `Plan de trabajo rechazado: ${body.rejectionComments}`,
        userId, userName,
      });
      notifyUsersAndAdmins({
        userIds: [wp.assignedExpert?._id, wp.createdBy?._id].filter((uid) => uid !== userId),
        type: 'warning',
        priority: 'alta',
        title: `Plan de Trabajo Rechazado: ${wp.case.caseCode}`,
        message: `El plan de trabajo del caso "${wp.case.title}" fue rechazado. Motivo: ${body.rejectionComments}`,
        linkUrl: `/crm/cases/${wp.case._id}`,
        mailbox: 'comite',
      }).catch((err) => console.error('[work-plan:reject] Error notificando:', err));
    }

    triggerEvent('work-plan:rejected', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error rechazando plan' }, { status: 500 });
  }
}
