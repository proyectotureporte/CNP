import { NextRequest, NextResponse } from 'next/server';
import { stats } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const stop = guardRole(request, (role) => hasPermission(role, 'dashboard'));
    if (stop) return stop;
    const data = await stats.getDashboardStats();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo estadisticas' }, { status: 500 });
  }
}
