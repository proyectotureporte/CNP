import { NextRequest, NextResponse } from 'next/server';
import { cases } from '@/lib/db';
import { CASE_STATUSES, CASE_STATUS_LABELS, type CaseStatus } from '@/lib/types';
import { VALID_TRANSITIONS, canChangeStatus } from '@/lib/cases/stateMachine';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';
import { notifyUsersAndAdmins } from '@/lib/notify';
import { auditEntityChange } from '@/lib/audit';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const userRole = request.headers.get('x-user-role') || '';
    const body = await request.json();
    const { status, assignedFinancieroId } = body as { status: string; assignedFinancieroId?: string };

    if (!status || !CASE_STATUSES.includes(status as CaseStatus)) {
      return NextResponse.json({ success: false, error: 'Estado no valido' }, { status: 400 });
    }

    const existing = await cases.getCaseById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    if (!canChangeStatus(userRole, existing.statusChangedByRole)) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para cambiar el estado de este caso en este momento' },
        { status: 403 }
      );
    }

    const validNext = VALID_TRANSITIONS[existing.status as CaseStatus] || [];
    if (!validNext.includes(status as CaseStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Transicion no permitida de "${CASE_STATUS_LABELS[existing.status as CaseStatus]}" a "${CASE_STATUS_LABELS[status as CaseStatus]}"`,
        },
        { status: 400 }
      );
    }

    // Juridico must assign financiero when setting to gestionado
    if (userRole === 'juridico' && status === 'gestionado' && !assignedFinancieroId) {
      return NextResponse.json(
        { success: false, error: 'Debe asignar un usuario financiero al gestionar el caso' },
        { status: 400 }
      );
    }

    const patch: Parameters<typeof cases.updateCase>[1] = {
      status: status as CaseStatus,
      statusChangedByRole: userRole,
    };

    if (status === 'gestionado' && assignedFinancieroId) {
      patch.assignedFinancieroId = assignedFinancieroId;
    }

    // When financiero returns case to creado, clear the chain and the assignment
    if (status === 'creado' && userRole === 'financiero') {
      patch.statusChangedByRole = 'financiero';
      patch.assignedFinancieroId = null;
    }

    const updated = await cases.updateCase(id, patch);

    const fromLabel = CASE_STATUS_LABELS[existing.status as CaseStatus] || existing.status;
    const toLabel = CASE_STATUS_LABELS[status as CaseStatus] || status;
    logCaseEvent({
      caseId: id,
      eventType: 'status_changed',
      description: `Estado cambiado de "${fromLabel}" a "${toLabel}" por ${userName || userRole}`,
      userId, userName,
    });

    auditEntityChange({
      request,
      action: 'update',
      entityType: 'case',
      entityId: id,
      before: { status: existing.status, assignedFinanciero: existing.assignedFinanciero?._id ?? null },
      after: { status, assignedFinanciero: patch.assignedFinancieroId ?? existing.assignedFinanciero?._id ?? null },
    });

    // RF-03/RF-13: toda transición notifica a los implicados del caso (+admins).
    const returned = status === 'creado' && userRole === 'financiero';
    notifyUsersAndAdmins({
      userIds: [
        existing.commercial?._id,
        existing.technicalAnalyst?._id,
        existing.assignedExpert?._id,
        existing.assignedFinanciero?._id,
        patch.assignedFinancieroId ?? undefined,
        existing.createdBy?._id,
      ].filter((uid) => uid !== userId),
      type: returned ? 'warning' : 'info',
      priority: returned ? 'alta' : 'normal',
      title: returned
        ? `Caso Devuelto: ${existing.caseCode}`
        : `Cambio de estado: ${existing.caseCode}`,
      message: returned
        ? `El caso "${existing.title}" fue devuelto por el area financiera y requiere su atencion.`
        : `El caso "${existing.title}" pasó de "${fromLabel}" a "${toLabel}" (${userName || userRole}).`,
      linkUrl: `/crm/cases/${id}`,
      mailbox: 'admin',
    }).catch((err) => console.error('[status] Error notificando cambio de estado:', err));

    triggerEvent('case:status-changed', { id, status });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error cambiando estado del caso' },
      { status: 500 }
    );
  }
}
