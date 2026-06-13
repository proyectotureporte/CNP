import { NextResponse } from 'next/server';
import { expert } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(request: Request) {
  try {
    const stop = guardRole(request, (r) => hasPermission(r, 'reports'));
    if (stop) return stop;

    const experts = await expert.reportExpertsPerformance();
    return NextResponse.json({ success: true, data: experts });
  } catch {
    return NextResponse.json({ success: false, error: 'Error generando reporte' }, { status: 500 });
  }
}
