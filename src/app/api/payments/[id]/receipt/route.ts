import { NextRequest, NextResponse } from 'next/server';
import { payment, caseDocument } from '@/lib/db';
import { uploadFile } from '@/lib/sanity/assets';
import { triggerEvent } from '@/lib/pusher/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await payment.getPaymentById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    }
    if (existing.status !== 'pendiente') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden subir justificantes a pagos pendientes' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Archivo de justificante es requerido' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await uploadFile(buffer, file.name, file.type);

    const updated = await payment.updatePayment(id, {
      fileUrl: asset.url,
      fileAssetId: asset.assetId,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      status: 'validado',
      paymentDate: new Date().toISOString(),
    });

    // Also create a caseDocument for this receipt
    if (existing.caseRef?._id) {
      const docName = `Justificante Pago ${existing.paymentNumber}`;
      await caseDocument.createCaseDocument({
        caseId: existing.caseRef._id,
        category: 'pago',
        fileName: docName,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: asset.url,
        fileAssetId: asset.assetId,
        version: 1,
        isVisibleToClient: true,
        description: docName,
      });
    }

    triggerEvent('payment:receipt', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error uploading receipt:', err);
    return NextResponse.json({ success: false, error: 'Error subiendo justificante' }, { status: 500 });
  }
}
