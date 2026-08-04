import { NextRequest, NextResponse } from 'next/server';
import { cases, workPlan } from '@/lib/db';
import { canEditWorkPlan } from '@/lib/auth/permissions';
import { actorUserReference, requireCaseAccess } from '@/lib/auth/caseAccess';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (access.actor.role === 'cliente') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
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

    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!canEditWorkPlan(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();

    const caseData = await cases.getCaseById(id);
    if (!caseData) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    const existingPlan = await workPlan.getCaseWorkPlan(id);
    if (existingPlan) {
      return NextResponse.json({ success: false, error: 'El caso ya tiene un plan de trabajo' }, { status: 409 });
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
      assignedExpertId: access.actor.role === 'perito'
        ? access.actor.userId
        : (body.assignedExpert || caseData.assignedExpert?._id || null),
      createdById: actorUserReference(access.actor),
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando plan de trabajo' }, { status: 500 });
  }
}
