import { NextRequest, NextResponse } from 'next/server';
import { stats } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { hasPermission } from '@/lib/auth/permissions';
import { actorFromRequest } from '@/lib/auth/caseAccess';

export async function GET(request: NextRequest) {
  try {
    const stop = guardRole(request, (role) => hasPermission(role, 'dashboard'));
    if (stop) return stop;
    const actor = actorFromRequest(request);
    if (!actor) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    const data = actor.allRoles
      ? await stats.getDashboardStats()
      : actor.role === 'perito_interno'
      ? await stats.getCaseOnlyDashboardStats(actor.userId)
      : actor.role === 'junta'
        ? await stats.getCaseOnlyDashboardStats()
        : await stats.getDashboardStats();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo estadisticas' }, { status: 500 });
  }
}
