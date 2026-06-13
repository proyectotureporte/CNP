import { NextRequest, NextResponse } from 'next/server';
import { workPlan, workPlanActivity } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { guardRole } from '@/lib/auth/guard';
import { canManageWorkPlanActions } from '@/lib/auth/permissions';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activities = await workPlanActivity.listByWorkPlan(id);
    const counts = {
      total: activities.length,
      completadas: activities.filter((a) => a.status === 'completada').length,
      en_progreso: activities.filter((a) => a.status === 'en_progreso').length,
      pendientes: activities.filter((a) => a.status === 'pendiente').length,
    };
    return NextResponse.json({ success: true, data: { activities, counts } });
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

    const stop = guardRole(request, canManageWorkPlanActions);
    if (stop) return stop;

    const body = await request.json();
    const userId = request.headers.get('x-user-id');

    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Titulo requerido' }, { status: 400 });
    }

    const plan = await workPlan.getWorkPlanById(id);
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan de trabajo no encontrado' }, { status: 404 });
    }
    const caseId = (plan as { case?: { _id: string } }).case?._id ?? null;

    const created = await workPlanActivity.createActivity({
      workPlanId: id,
      caseId,
      title: body.title.trim(),
      description: body.description || '',
      status: 'pendiente',
      dueDate: body.dueDate || null,
      assignedToId: body.assignedTo || null,
      createdById: userId && userId !== 'admin' ? userId : null,
    });

    triggerEvent('activity:created', { workPlanId: id });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando actividad' }, { status: 500 });
  }
}
