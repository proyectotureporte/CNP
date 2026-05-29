import { NextRequest, NextResponse } from 'next/server';
import { payment } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payments = await payment.listQuotePayments(id);
    return NextResponse.json({ success: true, data: payments });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo pagos de cotizacion' },
      { status: 500 }
    );
  }
}
