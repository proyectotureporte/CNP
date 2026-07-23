import { NextRequest, NextResponse } from 'next/server';
import { quote, cases } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { canApproveQuote } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import type { Quote } from '@/lib/types';
import { triggerEvent } from '@/lib/realtime/server';
import { notifyUsersAndAdmins } from '@/lib/notify';
import { auditEntityChange } from '@/lib/audit';

type QuoteWithCase = Quote & { case?: { _id: string; caseCode: string; title: string } };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canApproveQuote);
    if (stop) return stop;

    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const body = (await request.json().catch(() => ({}))) as { acceptanceNotes?: string };

    const existing = (await quote.getQuoteById(id)) as QuoteWithCase | null;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }
    if (existing.status !== 'enviada') {
      return NextResponse.json({ success: false, error: 'Solo se pueden aprobar cotizaciones enviadas' }, { status: 400 });
    }

    const updated = await quote.updateQuote(id, {
      status: 'aprobada',
      approvedAt: new Date().toISOString(),
      approvedById: userId && userId !== 'admin' ? userId : null,
      acceptanceNotes: body.acceptanceNotes?.trim() || null,
    });

    const caseId = existing.case?._id;
    if (caseId) {
      const versionLabel = existing.version ? ` v${existing.version}` : '';
      await logCaseEvent({
        caseId,
        eventType: 'quote_approved',
        description: body.acceptanceNotes?.trim()
          ? `Cotizacion${versionLabel} aprobada (${body.acceptanceNotes.trim()})`
          : `Cotizacion${versionLabel} aprobada`,
        userId, userName,
      });

      // RF-18: propuesta aceptada = caso ganado en el pipeline comercial.
      const caseRow = await cases.getCaseById(caseId);
      if (caseRow && caseRow.commercialStatus !== 'ganado') {
        await cases.updateCase(caseId, { commercialStatus: 'ganado' });
      }

      notifyUsersAndAdmins({
        userIds: [caseRow?.commercial?._id, caseRow?.createdBy?._id, caseRow?.assignedFinanciero?._id].filter(
          (uid) => uid !== userId,
        ),
        type: 'success',
        priority: 'alta',
        title: `Propuesta aprobada: ${caseRow?.caseCode ?? ''}`,
        message: `La cotización v${existing.version} del caso "${caseRow?.title ?? ''}" fue aprobada.`,
        linkUrl: `/crm/cases/${caseId}`,
        mailbox: 'admin',
      }).catch((err) => console.error('[quote:approve] Error notificando:', err));
    }

    auditEntityChange({
      request,
      action: 'update',
      entityType: 'quote',
      entityId: id,
      before: { status: existing.status },
      after: { status: 'aprobada', acceptanceNotes: body.acceptanceNotes?.trim() || null },
    });

    triggerEvent('quote:approved', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error aprobando cotizacion' }, { status: 500 });
  }
}
