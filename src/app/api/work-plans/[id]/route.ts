import { NextRequest, NextResponse } from 'next/server';
import { workPlan } from '@/lib/db';
import { canEditWorkPlan } from '@/lib/auth/permissions';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import type { WorkPlan } from '@/lib/types';

type WorkPlanWithCase = WorkPlan & { case?: { _id: string } };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plan = await workPlan.getWorkPlanById(id);
    if (!plan) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    const caseId = (plan as WorkPlanWithCase).case?._id;
    if (!caseId) return NextResponse.json({ success: false, error: 'Plan sin caso asociado' }, { status: 409 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;
    if (!access.actor.allRoles && !['comercial_juridico', 'perito_interno', 'perito'].includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
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
    const caseId = (existing as WorkPlanWithCase).case?._id;
    if (!caseId) return NextResponse.json({ success: false, error: 'Plan sin caso asociado' }, { status: 409 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;
    if (!canEditWorkPlan(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
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
