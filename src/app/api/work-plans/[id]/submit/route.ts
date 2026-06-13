import { NextRequest, NextResponse } from 'next/server';
import { workPlan } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { guardRole } from '@/lib/auth/guard';
import { canManageWorkPlanActions } from '@/lib/auth/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canManageWorkPlanActions);
    if (stop) return stop;

    const existing = await workPlan.getWorkPlanById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    if (existing.status !== 'borrador' && existing.status !== 'rechazado') {
      return NextResponse.json({ success: false, error: 'Solo se pueden enviar planes en borrador' }, { status: 400 });
    }

    const updated = await workPlan.updateWorkPlan(id, { status: 'enviado', submittedAt: new Date().toISOString() });
    triggerEvent('work-plan:submitted', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error enviando plan' }, { status: 500 });
  }
}
