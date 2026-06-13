import { NextRequest, NextResponse } from 'next/server';
import { workPlan } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { canManageWorkPlanActions } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const stop = guardRole(request, canManageWorkPlanActions);
    if (stop) return stop;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const [data, total] = await Promise.all([
      workPlan.listAllWorkPlans(status, limit, offset),
      workPlan.countAllWorkPlans(status),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo planes de trabajo' }, { status: 500 });
  }
}
