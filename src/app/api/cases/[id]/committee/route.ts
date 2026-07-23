import { NextRequest, NextResponse } from 'next/server';
import { cases, committeeReview } from '@/lib/db';
import { COMMITTEE_VIABILITIES, COMMITTEE_VIABILITY_LABELS, type CommitteeViability } from '@/lib/types';
import { guardRole } from '@/lib/auth/guard';
import { canManageCommittee } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';
import { notifyUsersAndAdmins } from '@/lib/notify';
import { auditEntityChange } from '@/lib/audit';

/** Comité del caso (RF-07): viabilidad, alcance, honorarios, entregables y tiempo. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const body = await request.json();
    const { viability, viabilityReason, scope, fees, deliverablesDescription, estimatedDays, notes } = body as {
      viability?: string;
      viabilityReason?: string;
      scope?: string;
      fees?: number;
      deliverablesDescription?: string;
      estimatedDays?: number;
      notes?: string;
    };

    if (viability && !COMMITTEE_VIABILITIES.includes(viability as CommitteeViability)) {
      return NextResponse.json({ success: false, error: 'Viabilidad no valida' }, { status: 400 });
    }
    if (viability === 'no_viable' && !viabilityReason?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Debe justificar por qué el caso no es viable' },
        { status: 400 }
      );
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
      scope: scope ?? null,
      fees: fees ?? null,
      deliverablesDescription: deliverablesDescription ?? null,
      estimatedDays: estimatedDays ?? null,
      notes: notes ?? null,
      decidedById: userId,
    });

    if (viability) {
      const label = COMMITTEE_VIABILITY_LABELS[viability as CommitteeViability];
      logCaseEvent({
        caseId: id,
        eventType: 'committee_decision',
        description: `Comité: caso dictaminado como "${label}" por ${userName || 'Sistema'}`,
        userId, userName,
      });

      notifyUsersAndAdmins({
        userIds: [existing.commercial?._id, existing.createdBy?._id, existing.technicalAnalyst?._id].filter(
          (uid) => uid !== userId,
        ),
        type: viability === 'no_viable' ? 'warning' : 'success',
        priority: 'alta',
        title: `Decisión de Comité: ${existing.caseCode}`,
        message: `El comité dictaminó el caso "${existing.title}" como "${label}".`,
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
        viability: viability ?? null,
        viabilityReason: viabilityReason ?? null,
        scope: scope ?? null,
        fees: fees ?? null,
        deliverablesDescription: deliverablesDescription ?? null,
        estimatedDays: estimatedDays ?? null,
        notes: notes ?? null,
      },
    });

    triggerEvent('case:updated', { id, committee: true });

    return NextResponse.json({ success: true, data: review });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error guardando la decisión del comité' },
      { status: 500 }
    );
  }
}
