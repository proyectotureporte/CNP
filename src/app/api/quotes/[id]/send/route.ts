import { NextRequest, NextResponse } from 'next/server';
import { quote, cases } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { canCreateQuote } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { QUOTE_CHANNELS, QUOTE_CHANNEL_LABELS, type Quote, type QuoteChannel } from '@/lib/types';
import { triggerEvent } from '@/lib/realtime/server';
import { notifyUsersAndAdmins } from '@/lib/notify';
import { sendQuoteSentEmail } from '@/lib/email';
import { auditEntityChange } from '@/lib/audit';

type QuoteWithCase = Quote & { case?: { _id: string; caseCode: string; title: string } };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canCreateQuote);
    if (stop) return stop;

    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const body = (await request.json().catch(() => ({}))) as {
      channel?: string;
      nextFollowUpDate?: string;
    };

    const existing = (await quote.getQuoteById(id)) as QuoteWithCase | null;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }
    if (existing.status !== 'borrador') {
      return NextResponse.json({ success: false, error: 'Solo se pueden enviar cotizaciones en borrador' }, { status: 400 });
    }

    // RF-08: el ENVÍO valida los campos obligatorios en servidor.
    const missing: string[] = [];
    if (!existing.totalPrice || existing.totalPrice <= 0) missing.push('precio total');
    if (!existing.finalValue || existing.finalValue <= 0) missing.push('valor final');
    if (!existing.validUntil) missing.push('fecha de validez (válida hasta)');
    if (!existing.firstPaymentDate) missing.push('fecha del primer pago');
    if (!body.channel) missing.push('canal de envío');
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `No se puede enviar: faltan campos obligatorios (${missing.join(', ')})` },
        { status: 400 }
      );
    }
    if (!QUOTE_CHANNELS.includes(body.channel as QuoteChannel)) {
      return NextResponse.json({ success: false, error: 'Canal de envío no valido' }, { status: 400 });
    }

    const updated = await quote.updateQuote(id, {
      status: 'enviada',
      sentAt: new Date().toISOString(),
      channel: body.channel as QuoteChannel,
      nextFollowUpDate: body.nextFollowUpDate || null,
    });

    const channelLabel = QUOTE_CHANNEL_LABELS[body.channel as QuoteChannel];
    const caseId = existing.case?._id;
    let caseRow = null;
    if (caseId) {
      caseRow = await cases.getCaseById(caseId);

      await logCaseEvent({
        caseId,
        eventType: 'other',
        description: `Cotizacion v${existing.version} enviada por ${channelLabel}`,
        userId, userName,
      });

      // RF-18: enviar propuesta mueve el pipeline comercial.
      if (caseRow && ['prospecto', 'en_analisis'].includes(caseRow.commercialStatus ?? 'prospecto')) {
        await cases.updateCase(caseId, { commercialStatus: 'propuesta_enviada' });
      }

      // Canal email real: aviso al cliente con enlace al portal.
      if (body.channel === 'email' && caseRow?.client?.email) {
        sendQuoteSentEmail({
          to: caseRow.client.email,
          clientName: caseRow.client.name || 'Cliente',
          caseCode: caseRow.caseCode,
          caseTitle: caseRow.title,
          finalValue: existing.finalValue,
          validUntil: existing.validUntil,
        }).catch((err) => console.error('[quote:send] Error enviando email al cliente:', err));
      }

      notifyUsersAndAdmins({
        userIds: [caseRow?.commercial?._id, caseRow?.createdBy?._id].filter((uid) => uid !== userId),
        type: 'info',
        priority: 'normal',
        title: `Propuesta enviada: ${caseRow?.caseCode ?? ''}`,
        message: `La cotización v${existing.version} del caso "${caseRow?.title ?? ''}" fue enviada por ${channelLabel}.`,
        linkUrl: `/crm/cases/${caseId}`,
      }).catch((err) => console.error('[quote:send] Error notificando:', err));
    }

    auditEntityChange({
      request,
      action: 'update',
      entityType: 'quote',
      entityId: id,
      before: { status: existing.status, channel: existing.channel ?? null },
      after: { status: 'enviada', channel: body.channel },
    });

    triggerEvent('quote:sent', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error enviando cotizacion' }, { status: 500 });
  }
}
