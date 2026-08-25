import { NextRequest, NextResponse } from 'next/server';
import { quote, payment } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { canCreateQuote } from '@/lib/auth/permissions';
import { uploadFile } from '@/lib/sanity/assets';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import type { Quote } from '@/lib/types';
import { triggerEvent } from '@/lib/realtime/server';
import { requireCaseAccess } from '@/lib/auth/caseAccess';

type QuoteWithCase = Quote & { case?: { _id: string; caseCode: string; title: string } };

function safeQuote(item: QuoteWithCase, role: string) {
  return {
    ...item,
    quoteDocumentUrl: undefined,
    downloadUrl: item.quoteDocumentUrl ? `/api/quotes/${item._id}/download` : undefined,
    ...(role === 'cliente' ? { createdBy: undefined, approvedBy: undefined } : {}),
  };
}

/**
 * Seguimiento comercial de la propuesta (RF-10): registrar una novedad y/o la
 * fecha del próximo seguimiento sobre una cotización ENVIADA (que es inmutable
 * en el resto de campos).
 */
export async function PATCH(
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
      nextFollowUpDate?: string | null;
      followUpNote?: string;
    };

    const existing = (await quote.getQuoteById(id)) as QuoteWithCase | null;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }
    const caseId = existing.case?._id;
    if (!caseId) return NextResponse.json({ success: false, error: 'Cotización sin caso asociado' }, { status: 409 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;
    if (!['enviada', 'borrador'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'El seguimiento solo aplica a cotizaciones en borrador o enviadas' },
        { status: 400 }
      );
    }
    if (body.nextFollowUpDate === undefined && !body.followUpNote?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Indique una novedad o la fecha del próximo seguimiento' },
        { status: 400 }
      );
    }

    const updated =
      body.nextFollowUpDate !== undefined
        ? await quote.updateQuote(id, { nextFollowUpDate: body.nextFollowUpDate || null })
        : existing;

    if (body.followUpNote?.trim() && existing.case?._id) {
      await logCaseEvent({
        caseId: existing.case._id,
        eventType: 'follow_up',
        description: `Seguimiento cotización v${existing.version}: ${body.followUpNote.trim()}`,
        userId, userName,
      });
    }

    triggerEvent('quote:updated', { id });
    return NextResponse.json({ success: true, data: updated && safeQuote(updated as QuoteWithCase, access.actor.role) });
  } catch {
    return NextResponse.json({ success: false, error: 'Error registrando el seguimiento' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (id === 'list') {
      const stop = guardRole(request, canCreateQuote);
      if (stop) return stop;
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;
      const [quotes, total] = await Promise.all([
        quote.listAllQuotes(status, limit, offset),
        quote.countAllQuotes(status),
      ]);
      return NextResponse.json({ success: true, data: quotes.map((item) => safeQuote(item as QuoteWithCase, request.headers.get('x-user-role') || '')), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    }
    const found = await quote.getQuoteById(id);
    if (!found) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }
    const typed = found as QuoteWithCase;
    const caseId = typed.case?._id;
    if (!caseId) return NextResponse.json({ success: false, error: 'Cotización sin caso asociado' }, { status: 409 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;
    if (!access.actor.allRoles && !['comercial_juridico', 'cliente'].includes(access.actor.role)) return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 });
    if (access.actor.role === 'cliente' && typed.status === 'borrador') {
      return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: safeQuote(typed, access.actor.role) });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo cotizacion' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canCreateQuote);
    if (stop) return stop;

    const existing = await quote.getQuoteById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }
    const typedExisting = existing as QuoteWithCase;
    const caseId = typedExisting.case?._id;
    if (!caseId) return NextResponse.json({ success: false, error: 'Cotización sin caso asociado' }, { status: 409 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;
    if (existing.status !== 'borrador') {
      return NextResponse.json({ success: false, error: 'Solo se pueden editar cotizaciones en borrador' }, { status: 400 });
    }

    const formData = await request.formData();

    const totalPrice = parseFloat(formData.get('totalPrice') as string) || existing.totalPrice;
    const dp = parseFloat(formData.get('discountPercentage') as string);
    const discountPercentage = isNaN(dp) ? existing.discountPercentage : dp;
    const notes = (formData.get('notes') as string) ?? existing.notes;
    const validUntil = (formData.get('validUntil') as string) || existing.validUntil || null;
    const firstPaymentDate = (formData.get('firstPaymentDate') as string) || existing.firstPaymentDate || null;
    const lastPaymentDate = (formData.get('lastPaymentDate') as string) || existing.lastPaymentDate || null;
    const customSplit = formData.get('customSplit') === 'true';
    const firstPaymentPercentage = customSplit
      ? parseFloat(formData.get('firstPaymentPercentage') as string) || existing.firstPaymentPercentage
      : 50;
    const quoteFile = formData.get('quoteDocument') as File | null;
    const quotedBusinessDays = parseInt(String(formData.get('quotedBusinessDays') || existing.quotedBusinessDays || 15), 10);

    if (!Number.isInteger(quotedBusinessDays) || quotedBusinessDays < 1 || quotedBusinessDays > 365) {
      return NextResponse.json({ success: false, error: 'El plazo debe estar entre 1 y 365 días hábiles' }, { status: 400 });
    }

    const finalValue = totalPrice - (totalPrice * discountPercentage / 100);

    let asset: Awaited<ReturnType<typeof uploadFile>> | null = null;
    if (quoteFile && quoteFile.size > 0) {
      const buffer = Buffer.from(await quoteFile.arrayBuffer());
      asset = await uploadFile(buffer, quoteFile.name, quoteFile.type);
    }

    const updated = await quote.updateQuote(id, {
      totalPrice, discountPercentage, finalValue, notes,
      validUntil, firstPaymentDate, lastPaymentDate, customSplit, firstPaymentPercentage, quotedBusinessDays,
      fileUrl: asset?.url,
      fileAssetId: asset?.assetId,
      fileName: asset?.originalFilename,
      mimeType: asset?.mimeType,
      fileSize: asset?.size,
    });

    // Update linked payments (amounts and dates)
    const payments = await payment.listQuotePayments(id);
    const secondPercentage = 100 - firstPaymentPercentage;
    const payment1Amount = Math.round(finalValue * firstPaymentPercentage / 100);
    const payment2Amount = finalValue - payment1Amount;

    await Promise.all(
      payments.map((p) => {
        if (p.paymentNumber === 1) {
          return payment.updatePayment(p._id, { amount: payment1Amount, percentage: firstPaymentPercentage, dueDate: firstPaymentDate });
        }
        if (p.paymentNumber === 2) {
          return payment.updatePayment(p._id, { amount: payment2Amount, percentage: secondPercentage, dueDate: lastPaymentDate });
        }
        return Promise.resolve(null);
      })
    );

    triggerEvent('quote:updated', { id });

    return NextResponse.json({ success: true, data: updated && safeQuote(updated as QuoteWithCase, access.actor.role) });
  } catch (err) {
    console.error('Error updating quote:', err);
    return NextResponse.json({ success: false, error: 'Error actualizando cotizacion' }, { status: 500 });
  }
}
