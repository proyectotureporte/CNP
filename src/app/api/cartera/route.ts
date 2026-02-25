import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import {
  listMonthPaymentsQuery,
  listUpcomingPaymentsQuery,
  listOverduePaymentsQuery,
  listPaymentsLast12MonthsQuery,
} from '@/lib/sanity/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Build date range for the selected month
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    // Current time for upcoming/overdue
    const now = new Date().toISOString();
    const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    // 12 months ago for historical chart
    const twelveMonthsAgo = new Date(year, month - 13, 1).toISOString();

    const [monthPayments, upcoming, overdue, historical] = await Promise.all([
      client.fetch(listMonthPaymentsQuery, { startDate, endDate }),
      client.fetch(listUpcomingPaymentsQuery, { now, fiveDaysLater }),
      client.fetch(listOverduePaymentsQuery, { now }),
      client.fetch(listPaymentsLast12MonthsQuery, { twelveMonthsAgo }),
    ]);

    return NextResponse.json({
      success: true,
      data: { monthPayments, upcoming, overdue, historical },
    });
  } catch (err) {
    console.error('Error fetching cartera:', err);
    return NextResponse.json(
      { success: false, error: 'Error obteniendo datos de cartera' },
      { status: 500 }
    );
  }
}
