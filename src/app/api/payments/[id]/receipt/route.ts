import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getPaymentByIdQuery } from '@/lib/sanity/queries';
import type { Payment } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payment = await client.fetch<Payment | null>(getPaymentByIdQuery, { id });
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    }

    if (payment.status !== 'pendiente') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden subir justificantes a pagos pendientes' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Archivo de justificante es requerido' },
        { status: 400 }
      );
    }

    // Upload to Sanity assets
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await writeClient.assets.upload('file', buffer, {
      filename: file.name,
      contentType: file.type,
    });

    const assetRef = { _type: 'reference' as const, _ref: asset._id };

    // Patch payment: set receipt file and mark as validado
    const updated = await writeClient
      .patch(id)
      .set({
        receiptFile: { _type: 'file', asset: assetRef },
        status: 'validado',
        paymentDate: new Date().toISOString(),
      })
      .commit();

    // Also create a caseDocument for this receipt
    if (payment.caseRef?._id) {
      const docName = `Justificante Pago ${payment.paymentNumber}`;
      await writeClient.create({
        _type: 'caseDocument',
        case: { _type: 'reference', _ref: payment.caseRef._id },
        category: 'pago',
        fileName: docName,
        fileSize: file.size,
        mimeType: file.type,
        version: 1,
        isVisibleToClient: true,
        description: docName,
        file: { _type: 'file', asset: assetRef },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error uploading receipt:', err);
    return NextResponse.json(
      { success: false, error: 'Error subiendo justificante' },
      { status: 500 }
    );
  }
}
