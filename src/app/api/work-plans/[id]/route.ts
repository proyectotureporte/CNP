import { NextRequest, NextResponse } from 'next/server';
import { workPlan } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plan = await workPlan.getWorkPlanById(id);
    if (!plan) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, data: plan });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo plan' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await workPlan.getWorkPlanById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    if (existing.status !== 'borrador' && existing.status !== 'rechazado') {
      return NextResponse.json({ success: false, error: 'Solo se pueden editar planes en borrador o rechazados' }, { status: 400 });
    }

    const updated = await workPlan.updateWorkPlan(id, {
      methodology: body.methodology,
      objectives: body.objectives,
      startDate: body.startDate,
      endDate: body.endDate,
      estimatedDays: body.estimatedDays,
      deliverablesDescription: body.deliverablesDescription,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando plan' }, { status: 500 });
  }
}
