import { NextRequest, NextResponse } from 'next/server';
import { cases } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const stop = guardRole(request, (r) => hasPermission(r, 'reports'));
    if (stop) return stop;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const discipline = searchParams.get('discipline') || '';
    const status = searchParams.get('status') || '';

    const data = await cases.reportCases({ startDate, endDate, discipline, status });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Error generando reporte' }, { status: 500 });
  }
}
