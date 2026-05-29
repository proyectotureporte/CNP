import { NextRequest, NextResponse } from 'next/server';
import { workPlan } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const existing = await workPlan.getWorkPlanById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    if (existing.status !== 'enviado' && existing.status !== 'en_revision') {
      return NextResponse.json({ success: false, error: 'Solo se pueden aprobar planes enviados' }, { status: 400 });
    }

    const updated = await workPlan.updateWorkPlan(id, {
      status: 'aprobado',
      committeeApprovedById: userId && userId !== 'admin' ? userId : null,
    });
    triggerEvent('work-plan:approved', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error aprobando plan' }, { status: 500 });
  }
}
