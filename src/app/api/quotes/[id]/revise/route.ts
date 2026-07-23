import { NextRequest, NextResponse } from 'next/server';
import { quote, payment } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { canCreateQuote } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import type { Quote } from '@/lib/types';
import { triggerEvent } from '@/lib/realtime/server';
import { auditEntityChange } from '@/lib/audit';

type QuoteWithCase = Quote & { case?: { _id: string; caseCode: string; title: string } };

/**
 * RF-09: un ajuste sobre una cotización ya enviada/rechazada/expirada NO la
 * edita — crea una NUEVA versión en borrador enlazada a la original
 * (parent_quote_id), con sus propios pagos.
 */
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

    const existing = (await quote.getQuoteById(id)) as QuoteWithCase | null;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }
    if (!['enviada', 'rechazada', 'expirada'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Solo se puede crear una nueva versión de una cotización enviada, rechazada o expirada' },
        { status: 400 }
      );
    }
    const caseId = existing.case?._id;
    if (!caseId) {
      return NextResponse.json({ success: false, error: 'La cotización no tiene caso asociado' }, { status: 400 });
    }

    const version = (await quote.getMaxQuoteVersion(caseId)) + 1;
    const createdById = userId && userId !== 'admin' ? userId : null;

    const created = await quote.createQuote({
      caseId,
      version,
      parentQuoteId: existing._id,
      totalPrice: existing.totalPrice,
      discountPercentage: existing.discountPercentage,
      finalValue: existing.finalValue,
      status: 'borrador',
      notes: existing.notes,
      validUntil: existing.validUntil ?? null,
      firstPaymentDate: existing.firstPaymentDate ?? null,
      lastPaymentDate: existing.lastPaymentDate ?? null,
      customSplit: existing.customSplit,
      firstPaymentPercentage: existing.firstPaymentPercentage,
      createdById,
    });

    if (!created) {
      return NextResponse.json({ success: false, error: 'Error creando la nueva versión' }, { status: 500 });
    }

    // Pagos propios de la nueva versión (mismo split que la original).
    const firstPct = existing.firstPaymentPercentage ?? 50;
    const finalValue = existing.finalValue ?? 0;
    const payment1Amount = Math.round((finalValue * firstPct) / 100);
    const payment2Amount = finalValue - payment1Amount;
    await Promise.all([
      payment.createPayment({
        caseId, quoteId: created._id, paymentNumber: 1,
        amount: payment1Amount, percentage: firstPct,
        dueDate: existing.firstPaymentDate ?? null, status: 'pendiente', createdById,
      }),
      payment.createPayment({
        caseId, quoteId: created._id, paymentNumber: 2,
        amount: payment2Amount, percentage: 100 - firstPct,
        dueDate: existing.lastPaymentDate ?? null, status: 'pendiente', createdById,
      }),
    ]);

    logCaseEvent({
      caseId,
      eventType: 'quote_created',
      description: `Cotizacion v${version} creada como ajuste de la v${existing.version}`,
      userId, userName,
    });

    auditEntityChange({
      request,
      action: 'create',
      entityType: 'quote',
      entityId: created._id,
      after: { version, parentQuoteId: existing._id, finalValue },
    });

    triggerEvent('quote:created', { caseId });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error('Error revising quote:', err);
    return NextResponse.json({ success: false, error: 'Error creando la nueva versión' }, { status: 500 });
  }
}
