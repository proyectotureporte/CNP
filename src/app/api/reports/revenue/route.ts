import { NextRequest, NextResponse } from 'next/server';
import { payment } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const stop = guardRole(request, (r) => hasPermission(r, 'reports'));
    if (stop) return stop;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const payments = await payment.reportRevenue(startDate, endDate);
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return NextResponse.json({ success: true, data: { payments, totalRevenue } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error generando reporte' }, { status: 500 });
  }
}
