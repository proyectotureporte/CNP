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
    const body = await request.json();
    const { rejectionReason } = body;

    const existing = (await quote.getQuoteById(id)) as QuoteWithCase | null;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }
    if (existing.status !== 'enviada') {
      return NextResponse.json({ success: false, error: 'Solo se pueden rechazar cotizaciones enviadas' }, { status: 400 });
    }
    if (!rejectionReason) {
      return NextResponse.json({ success: false, error: 'La razon de rechazo es requerida' }, { status: 400 });
    }

    const updated = await quote.updateQuote(id, { status: 'rechazada', rejectionReason });

    const caseId = existing.case?._id;
    if (caseId) {
      await logCaseEvent({
        caseId,
        eventType: 'quote_rejected',
        description: `Cotizacion rechazada: ${rejectionReason}`,
        userId, userName,
      });

      // RF-18: propuesta rechazada devuelve el pipeline a negociación (el
      // comercial decide si ajusta con nueva versión o marca el caso perdido).
      const caseRow = await cases.getCaseById(caseId);
      if (caseRow && caseRow.commercialStatus === 'propuesta_enviada') {
        await cases.updateCase(caseId, { commercialStatus: 'negociacion' });
      }

      notifyUsersAndAdmins({
        userIds: [caseRow?.commercial?._id, caseRow?.createdBy?._id, caseRow?.assignedFinanciero?._id].filter(
          (uid) => uid !== userId,
        ),
        type: 'warning',
        priority: 'alta',
        title: `Propuesta rechazada: ${caseRow?.caseCode ?? ''}`,
        message: `La cotización v${existing.version} del caso "${caseRow?.title ?? ''}" fue rechazada. Motivo: ${rejectionReason}`,
        linkUrl: `/crm/cases/${caseId}`,
        mailbox: 'admin',
      }).catch((err) => console.error('[quote:reject] Error notificando:', err));
    }

    auditEntityChange({
      request,
      action: 'update',
      entityType: 'quote',
      entityId: id,
      before: { status: existing.status },
      after: { status: 'rechazada', rejectionReason },
    });

    triggerEvent('quote:rejected', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error rechazando cotizacion' }, { status: 500 });
  }
}
