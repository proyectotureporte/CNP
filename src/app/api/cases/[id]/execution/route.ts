import { NextRequest, NextResponse } from 'next/server';
import { cases } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import { addBusinessDays, businessDaysBetween } from '@/lib/dates/businessDays';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { notifyUsersAndAdmins } from '@/lib/notify';
import { triggerEvent } from '@/lib/realtime/server';

function clockView(caseData: Awaited<ReturnType<typeof cases.getCaseById>>) {
  if (!caseData?.executionStartDate) {
    return { state: 'no_iniciada', totalBusinessDays: caseData?.executionBusinessDays || 15, remainingBusinessDays: null, deadline: null, alert: false };
  }
  const remaining = caseData.executionState === 'suspendida'
    ? Math.max(0, caseData.executionRemainingBusinessDays ?? 0)
    : caseData.executionDeadline
      ? Math.max(0, businessDaysBetween(new Date(), new Date(caseData.executionDeadline)))
      : 0;
  return {
    state: caseData.executionState || 'activa',
    totalBusinessDays: caseData.executionBusinessDays || 15,
    remainingBusinessDays: remaining,
    startDate: caseData.executionStartDate,
    deadline: caseData.executionDeadline || null,
    suspendedAt: caseData.executionSuspendedAt || null,
    alert: caseData.executionState === 'activa' && remaining <= 3,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireCaseAccess(request, id);
  if (access.response) return access.response;
  const caseData = await cases.getCaseById(id);
  return NextResponse.json({ success: true, data: clockView(caseData) });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!access.actor.allRoles && access.actor.role !== 'comercial_juridico') {
      return NextResponse.json({ success: false, error: 'Solo el área jurídica puede suspender o reanudar el plazo' }, { status: 403 });
    }
    const body = await request.json();
    const action = String(body.action || '');
    const caseData = await cases.getCaseById(id);
    if (!caseData?.executionStartDate || !caseData.executionDeadline) {
      return NextResponse.json({ success: false, error: 'El reloj todavía no ha iniciado' }, { status: 409 });
    }

    if (action === 'suspend') {
      if (caseData.executionState !== 'activa') {
        return NextResponse.json({ success: false, error: 'Solo se puede suspender un reloj activo' }, { status: 409 });
      }
      const remaining = Math.max(0, businessDaysBetween(new Date(), new Date(caseData.executionDeadline)));
      await cases.updateCase(id, {
        executionState: 'suspendida',
        executionSuspendedAt: new Date().toISOString(),
        executionRemainingBusinessDays: remaining,
      });
      logCaseEvent({
        caseId: id,
        eventType: 'execution_suspended',
        description: `Ejecución suspendida con ${remaining} día(s) hábil(es) restantes`,
        userId: access.actor.userId,
        userName: access.actor.displayName,
      });
    } else if (action === 'resume') {
      if (caseData.executionState !== 'suspendida') {
        return NextResponse.json({ success: false, error: 'El reloj no está suspendido' }, { status: 409 });
      }
      const remaining = Math.max(0, caseData.executionRemainingBusinessDays ?? 0);
      const deadline = addBusinessDays(new Date(), remaining);
      await cases.updateCase(id, {
        executionState: 'activa',
        executionSuspendedAt: null,
        executionDeadline: deadline.toISOString(),
        executionRemainingBusinessDays: remaining,
      });
      logCaseEvent({
        caseId: id,
        eventType: 'execution_resumed',
        description: `Ejecución reanudada; nuevo vencimiento ${deadline.toLocaleDateString('es-CO')}`,
        userId: access.actor.userId,
        userName: access.actor.displayName,
      });
    } else {
      return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
    }

    await notifyUsersAndAdmins({
      userIds: [access.row.assignedExpertId, access.row.assignedFinancieroId, access.row.assignedJuridicoId],
      title: action === 'suspend' ? 'Plazo de ejecución suspendido' : 'Plazo de ejecución reanudado',
      message: `Se actualizó el contador de días hábiles del caso.`,
      priority: 'alta',
      linkUrl: `/crm/cases/${id}`,
    });
    triggerEvent('case:updated', { id, executionAction: action });
    const updated = await cases.getCaseById(id);
    return NextResponse.json({ success: true, data: clockView(updated) });
  } catch (error) {
    console.error('[execution-clock] error:', error);
    return NextResponse.json({ success: false, error: 'Error actualizando el plazo' }, { status: 500 });
  }
}
