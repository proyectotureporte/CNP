import { NextRequest, NextResponse } from 'next/server';
import { quote } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { canCreateQuote } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import type { Quote } from '@/lib/types';
import { triggerEvent } from '@/lib/realtime/server';
import { auditEntityChange } from '@/lib/audit';
import { requireCaseAccess } from '@/lib/auth/caseAccess';

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
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;

    const version = (await quote.getMaxQuoteVersion(caseId)) + 1;
    const createdById = userId && userId !== 'admin' ? userId : null;

    const finalValue = existing.finalValue ?? 0;
    const payment1Amount = Math.round(finalValue * 0.50);
    const payment2Amount = Math.round(finalValue * 0.25);
    const payment3Amount = finalValue - payment1Amount - payment2Amount;
    const created = await quote.createQuoteWithPaymentPlan({
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
      secondPaymentDate: existing.secondPaymentDate ?? null,
      lastPaymentDate: existing.lastPaymentDate ?? null,
      customSplit: false,
      firstPaymentPercentage: 50,
      quotedBusinessDays: existing.quotedBusinessDays ?? 15,
      createdById,
    }, [
      { paymentNumber: 1, amount: payment1Amount, percentage: 50, dueDate: existing.firstPaymentDate ?? null, createdById },
      { paymentNumber: 2, amount: payment2Amount, percentage: 25, dueDate: existing.secondPaymentDate ?? null, createdById },
      { paymentNumber: 3, amount: payment3Amount, percentage: 25, dueDate: existing.lastPaymentDate ?? null, createdById },
    ]);

    if (!created) {
      return NextResponse.json({ success: false, error: 'Error creando la nueva versión' }, { status: 500 });
    }

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

    return NextResponse.json({ success: true, data: created && { ...created, quoteDocumentUrl: undefined, downloadUrl: created.quoteDocumentUrl ? `/api/quotes/${created._id}/download` : undefined } }, { status: 201 });
  } catch (err) {
    console.error('Error revising quote:', err);
    return NextResponse.json({ success: false, error: 'Error creando la nueva versión' }, { status: 500 });
  }
}
