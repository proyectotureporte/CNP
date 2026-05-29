import { NextRequest, NextResponse } from 'next/server';
import { quote, payment } from '@/lib/db';
import { uploadFile } from '@/lib/sanity/assets';
import { triggerEvent } from '@/lib/pusher/server';

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
      const offset = (page - 1) * limit;
      const [quotes, total] = await Promise.all([
        quote.listAllQuotes(status, limit, offset),
        quote.countAllQuotes(status),
      ]);
      return NextResponse.json({ success: true, data: quotes, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    }
    const found = await quote.getQuoteById(id);
    if (!found) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: found });
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

    const existing = await quote.getQuoteById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }
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

    const finalValue = totalPrice - (totalPrice * discountPercentage / 100);

    let asset: Awaited<ReturnType<typeof uploadFile>> | null = null;
    if (quoteFile && quoteFile.size > 0) {
      const buffer = Buffer.from(await quoteFile.arrayBuffer());
      asset = await uploadFile(buffer, quoteFile.name, quoteFile.type);
    }

    const updated = await quote.updateQuote(id, {
      totalPrice, discountPercentage, finalValue, notes,
      validUntil, firstPaymentDate, lastPaymentDate, customSplit, firstPaymentPercentage,
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

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating quote:', err);
    return NextResponse.json({ success: false, error: 'Error actualizando cotizacion' }, { status: 500 });
  }
}
