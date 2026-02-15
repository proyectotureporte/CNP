import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { reportRevenueQuery } from '@/lib/sanity/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const payments = await client.fetch(reportRevenueQuery, { startDate, endDate });
    const totalRevenue = payments.reduce((sum: number, p: { amount: number }) => sum + (p.amount || 0), 0);
    return NextResponse.json({ success: true, data: { payments, totalRevenue } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error generando reporte' }, { status: 500 });
  }
}
