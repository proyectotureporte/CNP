import { NextRequest, NextResponse } from 'next/server';
import { cases } from '@/lib/db';
import { COMMERCIAL_STATUSES, COMMERCIAL_STATUS_LABELS, type CommercialStatus } from '@/lib/types';
import { COMMERCIAL_TRANSITIONS } from '@/lib/cases/stateMachine';
import { guardRole } from '@/lib/auth/guard';
import { canChangeCommercialStatus } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';
import { notifyUsersAndAdmins } from '@/lib/notify';
import { auditEntityChange } from '@/lib/audit';

/**
 * Pipeline COMERCIAL del caso (RF-18): independiente del estado técnico.
 * Al marcar 'perdido' el motivo es obligatorio (RF-10/RF-11).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const stop = guardRole(request, canChangeCommercialStatus);
    if (stop) return stop;

    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const body = await request.json();
    const { commercialStatus, lossReason } = body as { commercialStatus: string; lossReason?: string };

    if (!commercialStatus || !COMMERCIAL_STATUSES.includes(commercialStatus as CommercialStatus)) {
      return NextResponse.json({ success: false, error: 'Etapa comercial no valida' }, { status: 400 });
    }

    const existing = await cases.getCaseById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    const current = (existing.commercialStatus ?? 'prospecto') as CommercialStatus;
    const next = commercialStatus as CommercialStatus;
    const validNext = COMMERCIAL_TRANSITIONS[current] || [];
    if (current !== next && !validNext.includes(next)) {
      return NextResponse.json(
        {
          success: false,
          error: `Transicion comercial no permitida de "${COMMERCIAL_STATUS_LABELS[current]}" a "${COMMERCIAL_STATUS_LABELS[next]}"`,
        },
        { status: 400 }
      );
    }

    if (next === 'perdido' && !lossReason?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Debe indicar el motivo de pérdida' },
        { status: 400 }
      );
    }

    const updated = await cases.updateCase(id, {
      commercialStatus: next,
      lossReason: next === 'perdido' ? lossReason!.trim() : existing.lossReason ?? null,
    });

    const fromLabel = COMMERCIAL_STATUS_LABELS[current];
    const toLabel = COMMERCIAL_STATUS_LABELS[next];
    logCaseEvent({
      caseId: id,
      eventType: 'status_changed',
      description:
        next === 'perdido'
          ? `Etapa comercial: "${fromLabel}" → "${toLabel}" (motivo: ${lossReason!.trim()}) por ${userName || 'Sistema'}`
          : `Etapa comercial: "${fromLabel}" → "${toLabel}" por ${userName || 'Sistema'}`,
      userId, userName,
    });

    auditEntityChange({
      request,
      action: 'update',
      entityType: 'case',
      entityId: id,
      before: { commercialStatus: current, lossReason: existing.lossReason ?? null },
      after: { commercialStatus: next, lossReason: next === 'perdido' ? lossReason!.trim() : existing.lossReason ?? null },
    });

    if (next === 'ganado' || next === 'perdido') {
      notifyUsersAndAdmins({
        userIds: [existing.commercial?._id, existing.createdBy?._id, existing.assignedFinanciero?._id].filter(
          (uid) => uid !== userId,
        ),
        type: next === 'ganado' ? 'success' : 'warning',
        priority: 'alta',
        title: `Caso ${next === 'ganado' ? 'Ganado' : 'Perdido'}: ${existing.caseCode}`,
        message:
          next === 'ganado'
            ? `El caso "${existing.title}" se marcó como ganado.`
            : `El caso "${existing.title}" se marcó como perdido. Motivo: ${lossReason!.trim()}`,
        linkUrl: `/crm/cases/${id}`,
        mailbox: 'admin',
      }).catch((err) => console.error('[commercial-status] Error notificando:', err));
    }

    triggerEvent('case:updated', { id, commercialStatus: next });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error cambiando la etapa comercial' },
      { status: 500 }
    );
  }
}
