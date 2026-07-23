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

    const userId = request.headers.get('x-user-id');
    const existing = await workPlan.getWorkPlanById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    if (existing.status !== 'enviado' && existing.status !== 'en_revision') {
      return NextResponse.json({ success: false, error: 'Solo se pueden aprobar planes enviados' }, { status: 400 });
    }

    const updated = await workPlan.updateWorkPlan(id, {
      status: 'aprobado',
      committeeApprovedById: userId && userId !== 'admin' ? userId : null,
    });

    const wp = existing as WorkPlanWithCase;
    if (wp.case?._id) {
      const userName = request.headers.get('x-user-name');
      logCaseEvent({
        caseId: wp.case._id,
        eventType: 'other',
        description: `Plan de trabajo aprobado por el comité`,
        userId, userName,
      });
      notifyUsersAndAdmins({
        userIds: [wp.assignedExpert?._id, wp.createdBy?._id].filter((uid) => uid !== userId),
        type: 'success',
        priority: 'alta',
        title: `Plan de Trabajo Aprobado: ${wp.case.caseCode}`,
        message: `El plan de trabajo del caso "${wp.case.title}" fue aprobado.`,
        linkUrl: `/crm/cases/${wp.case._id}`,
        mailbox: 'comite',
      }).catch((err) => console.error('[work-plan:approve] Error notificando:', err));
    }

    triggerEvent('work-plan:approved', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error aprobando plan' }, { status: 500 });
  }
}
