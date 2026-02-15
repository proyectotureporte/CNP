import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { reportCasesQuery } from '@/lib/sanity/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const discipline = searchParams.get('discipline') || '';
    const status = searchParams.get('status') || '';

    const cases = await client.fetch(reportCasesQuery, { startDate, endDate, discipline, status });
    return NextResponse.json({ success: true, data: cases });
  } catch {
    return NextResponse.json({ success: false, error: 'Error generando reporte' }, { status: 500 });
  }
}
