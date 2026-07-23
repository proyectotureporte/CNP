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

    const existing = await workPlan.getWorkPlanById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    if (existing.status !== 'borrador' && existing.status !== 'rechazado') {
      return NextResponse.json({ success: false, error: 'Solo se pueden enviar planes en borrador' }, { status: 400 });
    }

    const updated = await workPlan.updateWorkPlan(id, { status: 'enviado', submittedAt: new Date().toISOString() });

    const wp = existing as WorkPlanWithCase;
    if (wp.case?._id) {
      const userId = request.headers.get('x-user-id');
      const userName = request.headers.get('x-user-name');
      logCaseEvent({
        caseId: wp.case._id,
        eventType: 'other',
        description: 'Plan de trabajo enviado a revisión del comité',
        userId, userName,
      });
      notifyUsersAndAdmins({
        userIds: [],
        type: 'info',
        priority: 'normal',
        title: `Plan de Trabajo por Revisar: ${wp.case.caseCode}`,
        message: `El plan de trabajo del caso "${wp.case.title}" fue enviado y espera revisión del comité.`,
        linkUrl: `/crm/work-plans`,
        mailbox: 'comite',
      }).catch((err) => console.error('[work-plan:submit] Error notificando:', err));
    }

    triggerEvent('work-plan:submitted', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error enviando plan' }, { status: 500 });
  }
}
