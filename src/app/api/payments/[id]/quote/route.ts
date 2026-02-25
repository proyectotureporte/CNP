import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { listQuotePaymentsQuery } from '@/lib/sanity/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payments = await client.fetch(listQuotePaymentsQuery, { quoteId: id });
    return NextResponse.json({ success: true, data: payments });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo pagos de cotizacion' },
      { status: 500 }
    );
  }
}
