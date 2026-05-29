import { NextRequest, NextResponse } from 'next/server';
import { cases, notification } from '@/lib/db';
import { CASE_STATUSES, CASE_STATUS_LABELS, type CaseStatus } from '@/lib/types';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/pusher/server';

// Chain: juridico → financiero → admin
const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  creado: ['gestionado', 'cancelado'],
  gestionado: ['creado', 'cancelado'],
  cancelado: ['creado'],
};

function canChangeStatus(userRole: string, statusChangedByRole?: string): boolean {
  if (userRole === 'admin') return true;
  if (userRole === 'juridico') {
    return !statusChangedByRole || statusChangedByRole === 'financiero';
  }
  if (userRole === 'financiero') {
    return statusChangedByRole === 'juridico';
  }
  return false;
}

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

    // When financiero returns case to creado, notify the juridico team
    if (status === 'creado' && userRole === 'financiero') {
      const recipients = new Set<string>();
      if (existing.commercial?._id) recipients.add(existing.commercial._id);
      if (existing.createdBy?._id) recipients.add(existing.createdBy._id);

      for (const recipientId of recipients) {
        notification.createNotification({
          userId: recipientId,
          type: 'warning',
          priority: 'alta',
          title: `Caso Devuelto: ${existing.caseCode}`,
          message: `El caso "${existing.title}" fue devuelto por el area financiera y requiere su atencion.`,
          linkUrl: `/crm/cases/${id}`,
        }).catch((err) => console.error('[status] Error creating return notification:', err));
      }
    }

    triggerEvent('case:status-changed', { id, status });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error cambiando estado del caso' },
      { status: 500 }
    );
  }
}
