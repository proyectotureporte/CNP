import { NextRequest, NextResponse } from 'next/server';
import { crmUser, workPlan, workPlanActivity } from '@/lib/db';
import { logCaseEvent } from '@/lib/sanity/logEvent';
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
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (access.actor.role === 'cliente') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    const [activities, counts] = await Promise.all([
      workPlanActivity.listWorkPlanActivities(id),
      workPlanActivity.countActivitiesByStatus(id),
    ]);
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

    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!canEditWorkPlan(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');

    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Nombre requerido' }, { status: 400 });
    }

    const currentPlan = await workPlan.getCaseWorkPlan(id);
    if (access.actor.role === 'perito'
      && (!currentPlan || !['borrador', 'rechazado'].includes(currentPlan.status))) {
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
      workPlanId: currentPlan?._id ?? null,
      caseId: id,
      title: body.title.trim(),
      description: body.description || '',
      status: 'pendiente',
      dueDate: body.dueDate || null,
      assignedToId,
      createdById: actorUserReference(access.actor),
    });

    logCaseEvent({
      caseId: id,
      eventType: 'other',
      description: `Actividad creada: "${body.title.trim()}"`,
      userId, userName,
    });

    triggerEvent('activity:created', { caseId: id });

    return NextResponse.json({
      success: true,
      data: created && sanitizeActivityForRole(created, access.actor.role),
    }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando actividad' }, { status: 500 });
  }
}
