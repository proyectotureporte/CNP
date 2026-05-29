import { NextResponse } from 'next/server';
import { stats } from '@/lib/db';

export async function GET() {
  try {
    const data = await stats.getDashboardStats();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo estadisticas' }, { status: 500 });
  }
}
