import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getCaseByIdQuery } from '@/lib/sanity/queries';
import { CASE_STATUSES, CASE_STATUS_LABELS, type CaseStatus, type CaseExpanded } from '@/lib/types';
import { logCaseEvent } from '@/lib/sanity/logEvent';

// Chain: juridico → financiero → admin
// - creado: juridico (or admin) can change
// - after juridico changes: only financiero (or admin) can change
// - after financiero changes: only admin can change
// - "devolver" = financiero sends back to creado so juridico can edit again

const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  creado: ['gestionado', 'cancelado'],
  gestionado: ['creado', 'cancelado'],  // financiero can return to creado or cancel
  cancelado: ['creado'],                // admin can reopen
};

function canChangeStatus(userRole: string, statusChangedByRole?: string): boolean {
  if (userRole === 'admin') return true;

  // Case in creado with no prior change or returned by financiero: juridico can change
  if (userRole === 'juridico') {
    return !statusChangedByRole || statusChangedByRole === 'financiero';
  }

  // After juridico changes: financiero can change
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
      return NextResponse.json(
        { success: false, error: 'Estado no valido' },
        { status: 400 }
      );
    }

    const existing = await client.fetch<CaseExpanded | null>(getCaseByIdQuery, { id });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Caso no encontrado' },
        { status: 404 }
      );
    }

    // Check permission chain
    if (!canChangeStatus(userRole, existing.statusChangedByRole)) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para cambiar el estado de este caso en este momento' },
        { status: 403 }
      );
    }

    // Validate transition
    const validNext = VALID_TRANSITIONS[existing.status] || [];
    if (!validNext.includes(status as CaseStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Transicion no permitida de "${CASE_STATUS_LABELS[existing.status]}" a "${CASE_STATUS_LABELS[status as CaseStatus]}"`,
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

    const patch: Record<string, unknown> = {
      status,
      statusChangedByRole: userRole,
    };

    // When juridico sets gestionado, assign financiero
    if (status === 'gestionado' && assignedFinancieroId) {
      patch.assignedFinanciero = { _type: 'reference', _ref: assignedFinancieroId };
    }

    // When returning to creado (devolver), clear the chain so juridico can act
    if (status === 'creado' && userRole === 'financiero') {
      patch.statusChangedByRole = 'financiero';
    }

    const updated = await writeClient.patch(id).set(patch).commit();

    const fromLabel = CASE_STATUS_LABELS[existing.status] || existing.status;
    const toLabel = CASE_STATUS_LABELS[status as CaseStatus] || status;
    logCaseEvent({
      caseId: id,
      eventType: 'status_changed',
      description: `Estado cambiado de "${fromLabel}" a "${toLabel}" por ${userName || userRole}`,
      userId, userName,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error cambiando estado del caso' },
      { status: 500 }
    );
  }
}
