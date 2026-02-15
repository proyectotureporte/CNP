import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { getDashboardStatsQuery } from '@/lib/sanity/queries';

export async function GET() {
  try {
    const stats = await client.fetch(getDashboardStatsQuery);
    return NextResponse.json({ success: true, data: stats });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo estadisticas' }, { status: 500 });
  }
}
