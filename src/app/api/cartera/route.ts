import { NextRequest, NextResponse } from 'next/server';
import { payment } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const stop = guardRole(request, (r) => hasPermission(r, 'cartera'));
    if (stop) return stop;

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    const now = new Date().toISOString();
    const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const twelveMonthsAgo = new Date(year, month - 13, 1).toISOString();

    const [monthPayments, upcoming, overdue, historical] = await Promise.all([
      payment.listMonthPayments(startDate, endDate),
      payment.listUpcomingPayments(now, fiveDaysLater),
      payment.listOverduePayments(now),
      payment.listPaymentsLast12Months(twelveMonthsAgo),
    ]);

    return NextResponse.json({
      success: true,
      data: { monthPayments, upcoming, overdue, historical },
    });
  } catch (err) {
    console.error('Error fetching cartera:', err);
    return NextResponse.json({ success: false, error: 'Error obteniendo datos de cartera' }, { status: 500 });
  }
}
