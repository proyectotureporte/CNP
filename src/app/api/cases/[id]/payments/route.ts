import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listCasePaymentsQuery } from '@/lib/sanity/queries';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payments = await client.fetch(listCasePaymentsQuery, { caseId: id });
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

    const doc: { _type: 'payment'; [key: string]: unknown } = {
      _type: 'payment',
      case: { _type: 'reference', _ref: id },
      amount: body.amount,
      paymentDate: body.paymentDate || new Date().toISOString(),
      paymentMethod: body.paymentMethod || 'transferencia',
      status: 'pendiente',
      transactionReference: body.transactionReference || '',
      notes: body.notes || '',
    };
    if (userId && userId !== 'admin') doc.createdBy = { _type: 'reference', _ref: userId };
    const created = await writeClient.create(doc);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando pago' }, { status: 500 });
  }
}
