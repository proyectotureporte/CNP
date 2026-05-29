import { NextResponse } from 'next/server';
import { expert } from '@/lib/db';

export async function GET() {
  try {
    const experts = await expert.reportExpertsPerformance();
    return NextResponse.json({ success: true, data: experts });
  } catch {
    return NextResponse.json({ success: false, error: 'Error generando reporte' }, { status: 500 });
  }
}
