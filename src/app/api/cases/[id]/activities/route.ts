import { NextRequest, NextResponse } from 'next/server';
import { workPlanActivity } from '@/lib/db';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [activities, counts] = await Promise.all([
      workPlanActivity.listWorkPlanActivities(id),
      workPlanActivity.countActivitiesByStatus(id),
    ]);
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
    const body = await request.json();
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');

    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Nombre requerido' }, { status: 400 });
    }

    const created = await workPlanActivity.createActivity({
      caseId: id,
      title: body.title.trim(),
      description: body.description || '',
      status: 'pendiente',
      dueDate: body.dueDate || null,
      assignedToId: body.assignedTo || null,
      createdById: userId && userId !== 'admin' ? userId : null,
    });

    logCaseEvent({
      caseId: id,
      eventType: 'other',
      description: `Actividad creada: "${body.title.trim()}"`,
      userId, userName,
    });

    triggerEvent('activity:created', { caseId: id });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando actividad' }, { status: 500 });
  }
}
