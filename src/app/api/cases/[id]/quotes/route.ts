import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listCaseQuotesQuery, countCaseQuotesQuery, getCaseByIdQuery } from '@/lib/sanity/queries';
import type { Quote, CaseExpanded } from '@/lib/types';
import { logCaseEvent } from '@/lib/sanity/logEvent';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quotes = await client.fetch<Quote[]>(listCaseQuotesQuery, { caseId: id });
    return NextResponse.json({ success: true, data: quotes });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo cotizaciones' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const formData = await request.formData();

    const totalPrice = parseFloat(formData.get('totalPrice') as string);
    const discountPercentage = parseFloat(formData.get('discountPercentage') as string) || 0;
    const validUntil = formData.get('validUntil') as string || undefined;
    const notes = formData.get('notes') as string || '';
    const quoteFile = formData.get('quoteDocument') as File | null;
    const firstPaymentDate = formData.get('firstPaymentDate') as string || undefined;
    const lastPaymentDate = formData.get('lastPaymentDate') as string || undefined;
    const customSplit = formData.get('customSplit') === 'true';
    const firstPaymentPercentage = customSplit
      ? parseFloat(formData.get('firstPaymentPercentage') as string) || 50
      : 50;

    // Verify case exists
    const existing = await client.fetch<CaseExpanded | null>(getCaseByIdQuery, { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    if (!totalPrice || totalPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Precio total es requerido y debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Calculate final value
    const finalValue = totalPrice - (totalPrice * discountPercentage / 100);

    // Get next version number
    const count = await client.fetch<number>(countCaseQuotesQuery, { caseId: id });

    // Upload file if provided
    let quoteDocumentAsset: { _type: 'reference'; _ref: string } | undefined;
    if (quoteFile && quoteFile.size > 0) {
      const buffer = Buffer.from(await quoteFile.arrayBuffer());
      const asset = await writeClient.assets.upload('file', buffer, {
        filename: quoteFile.name,
        contentType: quoteFile.type,
      });
      quoteDocumentAsset = { _type: 'reference', _ref: asset._id };
    }

    const doc: { _type: 'quote'; [key: string]: unknown } = {
      _type: 'quote',
      case: { _type: 'reference', _ref: id },
      version: count + 1,
      totalPrice,
      discountPercentage,
      finalValue,
      status: 'borrador',
      notes,
      validUntil: validUntil || undefined,
      firstPaymentDate: firstPaymentDate || undefined,
      lastPaymentDate: lastPaymentDate || undefined,
      customSplit,
      firstPaymentPercentage,
    };

    if (quoteDocumentAsset) {
      doc.quoteDocument = { _type: 'file', asset: quoteDocumentAsset };
    }

    if (userId && userId !== 'admin') {
      doc.createdBy = { _type: 'reference', _ref: userId };
    }

    const created = await writeClient.create(doc);

    // Also create a caseDocument if file was uploaded
    if (quoteDocumentAsset && quoteFile) {
      await writeClient.create({
        _type: 'caseDocument',
        case: { _type: 'reference', _ref: id },
        category: 'cotizacion',
        fileName: quoteFile.name,
        fileSize: quoteFile.size,
        mimeType: quoteFile.type,
        version: count + 1,
        isVisibleToClient: true,
        description: `Documento de cotizacion v${count + 1}`,
        file: { _type: 'file', asset: quoteDocumentAsset },
        ...(userId && userId !== 'admin' ? { createdBy: { _type: 'reference', _ref: userId } } : {}),
      });
    }

    // Auto-create 2 payments linked to quote and case
    const secondPercentage = 100 - firstPaymentPercentage;
    const payment1Amount = Math.round(finalValue * firstPaymentPercentage / 100);
    const payment2Amount = finalValue - payment1Amount;

    const paymentBase = {
      _type: 'payment' as const,
      case: { _type: 'reference' as const, _ref: id },
      quote: { _type: 'reference' as const, _ref: created._id },
      status: 'pendiente',
      ...(userId && userId !== 'admin' ? { createdBy: { _type: 'reference' as const, _ref: userId } } : {}),
    };

    await Promise.all([
      writeClient.create({
        ...paymentBase,
        paymentNumber: 1,
        amount: payment1Amount,
        percentage: firstPaymentPercentage,
        dueDate: firstPaymentDate || undefined,
      }),
      writeClient.create({
        ...paymentBase,
        paymentNumber: 2,
        amount: payment2Amount,
        percentage: secondPercentage,
        dueDate: lastPaymentDate || undefined,
      }),
    ]);

    logCaseEvent({
      caseId: id,
      eventType: 'quote_created',
      description: `Cotizacion v${count + 1} creada por $${finalValue.toLocaleString('es-CO')}`,
      userId, userName,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error('Error creating quote:', err);
    return NextResponse.json(
      { success: false, error: 'Error creando cotizacion' },
      { status: 500 }
    );
  }
}
