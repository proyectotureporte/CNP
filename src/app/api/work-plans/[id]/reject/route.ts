import { NextRequest, NextResponse } from 'next/server';
import { workPlan } from '@/lib/db';
import { triggerEvent } from '@/lib/pusher/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.rejectionComments) {
      return NextResponse.json({ success: false, error: 'Comentarios de rechazo requeridos' }, { status: 400 });
    }
    const existing = await workPlan.getWorkPlanById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });

    const updated = await workPlan.updateWorkPlan(id, { status: 'rechazado', rejectionComments: body.rejectionComments });
    triggerEvent('work-plan:rejected', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error rechazando plan' }, { status: 500 });
  }
}
