import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getPaymentByIdQuery, listAllPaymentsQuery, countAllPaymentsQuery } from '@/lib/sanity/queries';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (id === 'list') {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const start = (page - 1) * limit;
      const end = start + limit;
      const [payments, total] = await Promise.all([
        client.fetch(listAllPaymentsQuery, { status, start, end }),
        client.fetch(countAllPaymentsQuery, { status }),
      ]);
      return NextResponse.json({ success: true, data: payments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    }
    const payment = await client.fetch(getPaymentByIdQuery, { id });
    if (!payment) return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, data: payment });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo pago' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await client.fetch(getPaymentByIdQuery, { id });
    if (!existing) return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.transactionReference) updateData.transactionReference = body.transactionReference;
    if (body.notes) updateData.notes = body.notes;
    const updated = await writeClient.patch(id).set(updateData).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando pago' }, { status: 500 });
  }
}
