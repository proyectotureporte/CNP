import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listWorkPlanActivitiesQuery, countActivitiesByStatusQuery } from '@/lib/sanity/queries';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/pusher/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [activities, counts] = await Promise.all([
      client.fetch(listWorkPlanActivitiesQuery, { caseId: id }),
      client.fetch(countActivitiesByStatusQuery, { caseId: id }),
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

    const doc: { _type: 'workPlanActivity'; [key: string]: unknown } = {
      _type: 'workPlanActivity',
      case: { _type: 'reference', _ref: id },
      title: body.title.trim(),
      description: body.description || '',
      status: 'pendiente',
    };

    if (body.dueDate) doc.dueDate = body.dueDate;
    if (body.assignedTo) doc.assignedTo = { _type: 'reference', _ref: body.assignedTo };
    if (userId && userId !== 'admin') {
      doc.createdBy = { _type: 'reference', _ref: userId };
    }

    const created = await writeClient.create(doc);

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
