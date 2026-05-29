import { NextRequest, NextResponse } from 'next/server';
import { payment } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payments = await payment.listCasePayments(id);
    return NextResponse.json({ success: true, data: payments });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo pagos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    if (!body.amount) return NextResponse.json({ success: false, error: 'Monto requerido' }, { status: 400 });

    const created = await payment.createPayment({
      caseId: id,
      amount: body.amount,
      paymentDate: body.paymentDate || new Date().toISOString(),
      paymentMethod: body.paymentMethod || 'transferencia',
      status: 'pendiente',
      transactionReference: body.transactionReference || '',
      notes: body.notes || '',
      createdById: userId && userId !== 'admin' ? userId : null,
    });

    triggerEvent('payment:updated', { caseId: id });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando pago' }, { status: 500 });
  }
}
