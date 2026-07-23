import { NextRequest, NextResponse } from 'next/server';
import { payment, caseDocument } from '@/lib/db';
import { uploadFile } from '@/lib/sanity/assets';
import { guardRole } from '@/lib/auth/guard';
import { canAccessFinances } from '@/lib/auth/permissions';
import { triggerEvent } from '@/lib/realtime/server';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { maybeStartExecutionClock } from '@/lib/cases/execution';
import { auditEntityChange } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canAccessFinances);
    if (stop) return stop;

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

    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');

    if (existing.caseRef?._id) {
      logCaseEvent({
        caseId: existing.caseRef._id,
        eventType: 'payment_recorded',
        description: `Pago ${existing.paymentNumber} validado con justificante`,
        userId, userName,
      });
      // Item 20: primer pago validado → arranca el reloj de 15 días hábiles.
      await maybeStartExecutionClock(existing.caseRef._id, { userId, userName });
    }

    auditEntityChange({
      request,
      action: 'update',
      entityType: 'payment',
      entityId: id,
      before: { status: existing.status },
      after: { status: 'validado' },
    });

    triggerEvent('payment:receipt', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error uploading receipt:', err);
    return NextResponse.json({ success: false, error: 'Error subiendo justificante' }, { status: 500 });
  }
}
