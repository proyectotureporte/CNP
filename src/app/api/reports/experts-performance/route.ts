import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { reportExpertsPerformanceQuery } from '@/lib/sanity/queries';

export async function GET() {
  try {
    const experts = await client.fetch(reportExpertsPerformanceQuery);
    return NextResponse.json({ success: true, data: experts });
  } catch {
    return NextResponse.json({ success: false, error: 'Error generando reporte' }, { status: 500 });
  }
}
