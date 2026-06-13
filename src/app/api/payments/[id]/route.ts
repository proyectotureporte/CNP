import { NextRequest, NextResponse } from 'next/server';
import { payment } from '@/lib/db';
import type { PaymentStatus } from '@/lib/types';
import { guardRole } from '@/lib/auth/guard';
import { canAccessFinances } from '@/lib/auth/permissions';
import { triggerEvent } from '@/lib/realtime/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (id === 'list') {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;
      const [payments, total] = await Promise.all([
        payment.listAllPayments(status, limit, offset),
        payment.countAllPayments(status),
      ]);
      return NextResponse.json({ success: true, data: payments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    }
    const found = await payment.getPaymentById(id);
    if (!found) return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, data: found });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo pago' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canAccessFinances);
    if (stop) return stop;

    const body = await request.json();
    const existing = await payment.getPaymentById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });

    const updated = await payment.updatePayment(id, {
      status: body.status as PaymentStatus | undefined,
      transactionReference: body.transactionReference,
      notes: body.notes,
    });

    triggerEvent('payment:updated', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando pago' }, { status: 500 });
  }
}
