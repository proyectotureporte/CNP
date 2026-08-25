import { NextRequest, NextResponse } from 'next/server';
import { payment } from '@/lib/db';
import { actorUserReference, requireCaseAccess } from '@/lib/auth/caseAccess';
import { canAccessFinances } from '@/lib/auth/permissions';
import { triggerEvent } from '@/lib/realtime/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!access.actor.allRoles && !['junta', 'cliente'].includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Los pagos del cliente no forman parte del portal del perito' }, { status: 403 });
    }
    const payments = access.actor.role === 'cliente'
      ? await payment.listClientCasePayments(id)
      : await payment.listCasePayments(id);
    return NextResponse.json({
      success: true,
      data: payments.map((item) => ({
        ...item,
        receiptUrl: undefined,
        receiptDownloadUrl: item.receiptUrl ? `/api/payments/${item._id}/receipt-download` : undefined,
        ...(access.actor.role === 'cliente' ? { createdBy: undefined } : {}),
      })),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo pagos' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!canAccessFinances(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    const body = await request.json();
    if (!Number(body.amount) || Number(body.amount) <= 0) {
      return NextResponse.json({ success: false, error: 'Monto requerido' }, { status: 400 });
    }
    const created = await payment.createPayment({
      caseId: id,
      amount: Number(body.amount),
      paymentDate: body.paymentDate || null,
      paymentMethod: body.paymentMethod || 'transferencia',
      status: 'pendiente',
      transactionReference: body.transactionReference || '',
      notes: body.notes || '',
      createdById: actorUserReference(access.actor),
    });
    triggerEvent('payment:updated', { caseId: id });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando pago' }, { status: 500 });
  }
}
