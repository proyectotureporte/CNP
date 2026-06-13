import { NextRequest, NextResponse } from 'next/server';
import { cases, quote, caseDocument, payment } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { canCreateQuote } from '@/lib/auth/permissions';
import { uploadFile } from '@/lib/sanity/assets';
import { verifyClientOwnsCase } from '@/lib/auth/clientAccess';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userRole = request.headers.get('x-user-role') || '';
    const userId = request.headers.get('x-user-id') || '';

    if (userRole === 'cliente') {
      const { owns } = await verifyClientOwnsCase(userId, id);
      if (!owns) {
        return NextResponse.json({ success: false, error: 'No tiene acceso a este caso' }, { status: 403 });
      }
    }

    const quotes = await quote.listCaseQuotes(id);
    return NextResponse.json({ success: true, data: quotes });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo cotizaciones' }, { status: 500 });
  }
}

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
    const formData = await request.formData();

    const totalPrice = parseFloat(formData.get('totalPrice') as string);
    const discountPercentage = parseFloat(formData.get('discountPercentage') as string) || 0;
    const validUntil = (formData.get('validUntil') as string) || null;
    const notes = (formData.get('notes') as string) || '';
    const quoteFile = formData.get('quoteDocument') as File | null;
    const firstPaymentDate = (formData.get('firstPaymentDate') as string) || null;
    const lastPaymentDate = (formData.get('lastPaymentDate') as string) || null;
    const customSplit = formData.get('customSplit') === 'true';
    const firstPaymentPercentage = customSplit
      ? parseFloat(formData.get('firstPaymentPercentage') as string) || 50
      : 50;

    const existing = await cases.getCaseById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    if (!totalPrice || totalPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Precio total es requerido y debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const finalValue = totalPrice - (totalPrice * discountPercentage / 100);
    const count = await quote.countCaseQuotes(id);
    const version = count + 1;

    // Upload quote document if provided
    let asset: Awaited<ReturnType<typeof uploadFile>> | null = null;
    if (quoteFile && quoteFile.size > 0) {
      const buffer = Buffer.from(await quoteFile.arrayBuffer());
      asset = await uploadFile(buffer, quoteFile.name, quoteFile.type);
    }

    const created = await quote.createQuote({
      caseId: id,
      version,
      totalPrice,
      discountPercentage,
      finalValue,
      status: 'borrador',
      notes,
      validUntil,
      firstPaymentDate,
      lastPaymentDate,
      customSplit,
      firstPaymentPercentage,
      createdById: userId && userId !== 'admin' ? userId : null,
      fileUrl: asset?.url,
      fileAssetId: asset?.assetId,
      fileName: asset?.originalFilename,
      mimeType: asset?.mimeType,
      fileSize: asset?.size,
    });

    if (!created) {
      return NextResponse.json({ success: false, error: 'Error creando cotizacion' }, { status: 500 });
    }

    // Also create a caseDocument if file was uploaded
    if (asset && quoteFile) {
      await caseDocument.createCaseDocument({
        caseId: id,
        category: 'cotizacion',
        fileName: quoteFile.name,
        fileSize: quoteFile.size,
        mimeType: quoteFile.type,
        fileUrl: asset.url,
        fileAssetId: asset.assetId,
        version,
        isVisibleToClient: true,
        description: `Documento de cotizacion v${version}`,
        uploadedById: userId && userId !== 'admin' ? userId : null,
      });
    }

    // Auto-create 2 payments linked to quote and case
    const secondPercentage = 100 - firstPaymentPercentage;
    const payment1Amount = Math.round(finalValue * firstPaymentPercentage / 100);
    const payment2Amount = finalValue - payment1Amount;
    const createdById = userId && userId !== 'admin' ? userId : null;

    await Promise.all([
      payment.createPayment({
        caseId: id, quoteId: created._id, paymentNumber: 1,
        amount: payment1Amount, percentage: firstPaymentPercentage,
        dueDate: firstPaymentDate, status: 'pendiente', createdById,
      }),
      payment.createPayment({
        caseId: id, quoteId: created._id, paymentNumber: 2,
        amount: payment2Amount, percentage: secondPercentage,
        dueDate: lastPaymentDate, status: 'pendiente', createdById,
      }),
    ]);

    logCaseEvent({
      caseId: id,
      eventType: 'quote_created',
      description: `Cotizacion v${version} creada por $${finalValue.toLocaleString('es-CO')}`,
      userId, userName,
    });

    triggerEvent('quote:created', { caseId: id });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error('Error creating quote:', err);
    return NextResponse.json({ success: false, error: 'Error creando cotizacion' }, { status: 500 });
  }
}
