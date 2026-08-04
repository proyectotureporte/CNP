import { NextRequest, NextResponse } from 'next/server';
import { crmUser, workPlan, workPlanActivity } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { canEditWorkPlan } from '@/lib/auth/permissions';
import {
  actorUserReference,
  requireCaseAccess,
  sanitizeActivityForRole,
} from '@/lib/auth/caseAccess';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseId = await workPlan.getWorkPlanCaseId(id);
    if (!caseId) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;
    if (access.actor.role === 'cliente') return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    const activities = await workPlanActivity.listByWorkPlan(id);
    const counts = {
      total: activities.length,
      completadas: activities.filter((a) => a.status === 'completada').length,
      en_progreso: activities.filter((a) => a.status === 'en_progreso').length,
      pendientes: activities.filter((a) => a.status === 'pendiente').length,
    };
    return NextResponse.json({
      success: true,
      data: {
        activities: activities.map((activity) => sanitizeActivityForRole(activity, access.actor.role)),
        counts,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo actividades' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caseId = await workPlan.getWorkPlanCaseId(id);
    if (!caseId) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;
    if (!canEditWorkPlan(access.actor.role)) return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });

    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Titulo requerido' }, { status: 400 });
    }

    const plan = await workPlan.getWorkPlanById(id);
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan de trabajo no encontrado' }, { status: 404 });
    }
    if (access.actor.role === 'perito' && !['borrador', 'rechazado'].includes(plan.status)) {
      return NextResponse.json(
        { success: false, error: 'Solo puedes agregar actividades mientras el plan esté en borrador o devuelto' },
        { status: 409 },
      );
    }
    const assignedToId = access.actor.role === 'perito'
      ? access.actor.userId
      : (body.assignedTo || null);
    if (assignedToId && access.actor.role !== 'perito') {
      const assignee = await crmUser.getUserById(assignedToId);
      if (!assignee || assignee.role === 'cliente') {
        return NextResponse.json({ success: false, error: 'La actividad no puede asignarse a un cliente final' }, { status: 400 });
      }
    }
    const created = await workPlanActivity.createActivity({
      workPlanId: id,
      caseId,
      title: body.title.trim(),
      description: body.description || '',
      status: 'pendiente',
      dueDate: body.dueDate || null,
      assignedToId,
      createdById: actorUserReference(access.actor),
    });

    triggerEvent('activity:created', { workPlanId: id });
    return NextResponse.json({
      success: true,
      data: created && sanitizeActivityForRole(created, access.actor.role),
    }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando actividad' }, { status: 500 });
  }
}
