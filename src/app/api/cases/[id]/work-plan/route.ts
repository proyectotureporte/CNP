import { NextRequest, NextResponse } from 'next/server';
import { cases, workPlan } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { canManageWorkPlanActions } from '@/lib/auth/permissions';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plan = await workPlan.getCaseWorkPlan(id);
    return NextResponse.json({ success: true, data: plan });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo plan de trabajo' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canManageWorkPlanActions);
    if (stop) return stop;

    const userId = request.headers.get('x-user-id');
    const body = await request.json();

    const caseData = await cases.getCaseById(id);
    if (!caseData) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    const created = await workPlan.createWorkPlan({
      caseId: id,
      methodology: body.methodology || '',
      objectives: body.objectives || '',
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      estimatedDays: body.estimatedDays || 0,
      deliverablesDescription: body.deliverablesDescription || '',
      status: 'borrador',
      assignedExpertId: body.assignedExpert || null,
      createdById: userId && userId !== 'admin' ? userId : null,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando plan de trabajo' }, { status: 500 });
  }
}
