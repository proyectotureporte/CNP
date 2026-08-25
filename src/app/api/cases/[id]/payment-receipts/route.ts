import { NextRequest, NextResponse } from 'next/server';
import { crmUser, payment } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import { uploadFile } from '@/lib/sanity/assets';
import { notifyUsers } from '@/lib/notify';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (access.actor.role !== 'cliente') {
      return NextResponse.json({ success: false, error: 'Esta acción corresponde al cliente final' }, { status: 403 });
    }

    const form = await request.formData();
    const paymentId = String(form.get('paymentId') || '');
    const file = form.get('file');
    if (!paymentId || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Selecciona el pago y su comprobante' }, { status: 400 });
    }
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'El comprobante supera 15 MB' }, { status: 400 });
    }
    const allowedReceiptTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedReceiptTypes.includes(file.type) && !/\.(pdf|jpe?g|png)$/i.test(file.name)) {
      return NextResponse.json({ success: false, error: 'El comprobante debe ser PDF, JPG o PNG' }, { status: 400 });
    }
    const paymentRow = await payment.getPaymentAccessRow(paymentId);
    if (!paymentRow || paymentRow.caseId !== id) {
      return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    }
    if (!paymentRow.clientVisible) {
      return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    }
    if (paymentRow.status === 'validado') {
      return NextResponse.json({ success: false, error: 'Un pago validado no puede volver a estado pendiente' }, { status: 409 });
    }

    const asset = await uploadFile(
      Buffer.from(await file.arrayBuffer()),
      file.name,
      file.type || 'application/octet-stream',
    );
    const updated = await payment.updatePayment(paymentId, {
      fileUrl: asset.url,
      fileAssetId: asset.assetId,
      fileName: asset.originalFilename || file.name,
      mimeType: asset.mimeType,
      fileSize: asset.size,
      receiptUploadedById: access.actor.userId,
      paymentDate: new Date().toISOString(),
      status: 'pendiente',
    });

    const juntaUsers = await crmUser.listUsersByRole('junta');
    await notifyUsers({
      userIds: juntaUsers.map((user) => user._id),
      title: 'Comprobante de pago pendiente de validación',
      message: `El cliente final cargó un comprobante para el pago ${updated?.paymentNumber ?? ''}.`,
      type: 'info',
      priority: 'alta',
      linkUrl: '/crm/cartera',
    });
    logCaseEvent({
      caseId: id,
      eventType: 'payment_receipt_uploaded',
      description: `Cliente final cargó comprobante del pago ${updated?.paymentNumber ?? ''}; queda pendiente de validación`,
      userId: access.actor.userId,
      userName: 'Cliente final',
    });
    triggerEvent('payment:receipt', { id: paymentId, caseId: id, status: 'pendiente' });
    return NextResponse.json({
      success: true,
      data: updated && {
        ...updated,
        receiptUrl: undefined,
        receiptDownloadUrl: `/api/payments/${paymentId}/receipt-download`,
      },
    });
  } catch (error) {
    console.error('[client-payment-receipt] error:', error);
    return NextResponse.json({ success: false, error: 'Error cargando comprobante' }, { status: 500 });
  }
}
