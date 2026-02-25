import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getQuoteByIdQuery, listAllQuotesQuery, countAllQuotesQuery, listQuotePaymentsQuery } from '@/lib/sanity/queries';
import type { Quote, Payment } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (id === 'list') {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const start = (page - 1) * limit;
      const end = start + limit;
      const [quotes, total] = await Promise.all([
        client.fetch(listAllQuotesQuery, { status, start, end }),
        client.fetch(countAllQuotesQuery, { status }),
      ]);
      return NextResponse.json({ success: true, data: quotes, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    }
    const quote = await client.fetch<Quote | null>(getQuoteByIdQuery, { id });
    if (!quote) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: quote });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo cotizacion' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await client.fetch<Quote | null>(getQuoteByIdQuery, { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }

    if (existing.status !== 'borrador') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden editar cotizaciones en borrador' },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const totalPrice = parseFloat(formData.get('totalPrice') as string) || existing.totalPrice;
    const discountPercentage = parseFloat(formData.get('discountPercentage') as string) ?? existing.discountPercentage;
    const notes = (formData.get('notes') as string) ?? existing.notes;
    const validUntil = (formData.get('validUntil') as string) || existing.validUntil;
    const firstPaymentDate = (formData.get('firstPaymentDate') as string) || existing.firstPaymentDate;
    const lastPaymentDate = (formData.get('lastPaymentDate') as string) || existing.lastPaymentDate;
    const customSplit = formData.get('customSplit') === 'true';
    const firstPaymentPercentage = customSplit
      ? parseFloat(formData.get('firstPaymentPercentage') as string) || existing.firstPaymentPercentage
      : 50;

    const quoteFile = formData.get('quoteDocument') as File | null;

    const finalValue = totalPrice - (totalPrice * discountPercentage / 100);

    // Upload new file if provided
    const patchOps: Record<string, unknown> = {
      totalPrice,
      discountPercentage,
      finalValue,
      notes,
      validUntil: validUntil || undefined,
      firstPaymentDate: firstPaymentDate || undefined,
      lastPaymentDate: lastPaymentDate || undefined,
      customSplit,
      firstPaymentPercentage,
    };

    if (quoteFile && quoteFile.size > 0) {
      const buffer = Buffer.from(await quoteFile.arrayBuffer());
      const asset = await writeClient.assets.upload('file', buffer, {
        filename: quoteFile.name,
        contentType: quoteFile.type,
      });
      patchOps.quoteDocument = { _type: 'file', asset: { _type: 'reference', _ref: asset._id } };
    }

    const updated = await writeClient
      .patch(id)
      .set(patchOps)
      .commit();

    // Update linked payments (amounts and dates)
    const payments = await client.fetch<Payment[]>(listQuotePaymentsQuery, { quoteId: id });
    const secondPercentage = 100 - firstPaymentPercentage;
    const payment1Amount = Math.round(finalValue * firstPaymentPercentage / 100);
    const payment2Amount = finalValue - payment1Amount;

    const paymentUpdates = payments.map((p) => {
      if (p.paymentNumber === 1) {
        return writeClient.patch(p._id).set({
          amount: payment1Amount,
          percentage: firstPaymentPercentage,
          dueDate: firstPaymentDate || undefined,
        }).commit();
      } else if (p.paymentNumber === 2) {
        return writeClient.patch(p._id).set({
          amount: payment2Amount,
          percentage: secondPercentage,
          dueDate: lastPaymentDate || undefined,
        }).commit();
      }
      return Promise.resolve();
    });

    await Promise.all(paymentUpdates);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating quote:', err);
    return NextResponse.json(
      { success: false, error: 'Error actualizando cotizacion' },
      { status: 500 }
    );
  }
}
