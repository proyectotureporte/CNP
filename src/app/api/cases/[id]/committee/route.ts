import { NextRequest, NextResponse } from 'next/server';
import { cases, committeeReview } from '@/lib/db';
import { COMMITTEE_VIABILITIES, COMMITTEE_VIABILITY_LABELS, type CommitteeViability } from '@/lib/types';
import { guardRole } from '@/lib/auth/guard';
import { canManageCommittee, canReadCommittee } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';
import { notifyUsersAndAdmins } from '@/lib/notify';
import { auditEntityChange } from '@/lib/audit';
import { requireCaseAccess } from '@/lib/auth/caseAccess';

/** Decisión de Junta: viabilidad, motivo y valor. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!canReadCommittee(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    const review = await committeeReview.getCommitteeReviewByCase(id);
    return NextResponse.json({ success: true, data: review });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error consultando el comité' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const stop = guardRole(request, canManageCommittee);
    if (stop) return stop;

    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const body = await request.json();
    const { viability, viabilityReason, fees } = body as {
      viability?: string;
      viabilityReason?: string;
      fees?: number;
    };

    if (viability && !COMMITTEE_VIABILITIES.includes(viability as CommitteeViability)) {
      return NextResponse.json({ success: false, error: 'Viabilidad no valida' }, { status: 400 });
    }
    if (!viability) {
      return NextResponse.json({ success: false, error: 'Debe definir la viabilidad' }, { status: 400 });
    }
    if (!viabilityReason?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Debe registrar el motivo de la decisión' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(Number(fees)) || Number(fees) <= 0) {
      return NextResponse.json({ success: false, error: 'Debe fijar un valor mayor a cero' }, { status: 400 });
    }

    const existing = await cases.getCaseById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    const previous = await committeeReview.getCommitteeReviewByCase(id);
    const review = await committeeReview.upsertCommitteeReview({
      caseId: id,
      viability: (viability as CommitteeViability) ?? null,
      viabilityReason: viabilityReason ?? null,
      fees: Number(fees),
      decidedById: userId,
    });

    if (viability) {
      const label = COMMITTEE_VIABILITY_LABELS[viability as CommitteeViability];
      logCaseEvent({
        caseId: id,
        eventType: 'committee_decision',
        description: `Junta: caso dictaminado como "${label}" por ${userName || 'Sistema'}`,
        userId, userName,
      });

      notifyUsersAndAdmins({
        userIds: [existing.assignedJuridico?._id, existing.commercial?._id, existing.createdBy?._id].filter(
          (uid) => uid !== userId,
        ),
        type: viability === 'no_viable' ? 'warning' : 'success',
        priority: 'alta',
        title: `Decisión de Junta: ${existing.caseCode}`,
        message: `La Junta dictaminó el caso "${existing.title}" como "${label}".`,
        linkUrl: `/crm/cases/${id}`,
        mailbox: 'comite',
      }).catch((err) => console.error('[committee] Error notificando decisión:', err));
    }

    auditEntityChange({
      request,
      action: previous ? 'update' : 'create',
      entityType: 'committee_review',
      entityId: id,
      before: previous
        ? {
            viability: previous.viability ?? null,
            viabilityReason: previous.viabilityReason ?? null,
            scope: previous.scope ?? null,
            fees: previous.fees ?? null,
            deliverablesDescription: previous.deliverablesDescription ?? null,
            estimatedDays: previous.estimatedDays ?? null,
            notes: previous.notes ?? null,
          }
        : null,
      after: {
        viability,
        viabilityReason: viabilityReason.trim(),
        fees: Number(fees),
      },
    });

    triggerEvent('case:updated', { id, committee: true });

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error('[committee] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Error guardando la decisión del comité' },
      { status: 500 }
    );
  }
}
