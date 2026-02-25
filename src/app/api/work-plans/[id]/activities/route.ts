import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listWorkPlanActivitiesQuery, countActivitiesByStatusQuery } from '@/lib/sanity/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [activities, counts] = await Promise.all([
      client.fetch(listWorkPlanActivitiesQuery, { workPlanId: id }),
      client.fetch(countActivitiesByStatusQuery, { workPlanId: id }),
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

    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Titulo requerido' }, { status: 400 });
    }

    // Get workPlan to find the case ref
    const workPlan = await client.fetch(
      `*[_type == "workPlan" && _id == $id][0]{ _id, "caseId": case._ref }`,
      { id }
    );
    if (!workPlan) {
      return NextResponse.json({ success: false, error: 'Plan de trabajo no encontrado' }, { status: 404 });
    }

    const doc: { _type: 'workPlanActivity'; [key: string]: unknown } = {
      _type: 'workPlanActivity',
      workPlan: { _type: 'reference', _ref: id },
      case: { _type: 'reference', _ref: workPlan.caseId },
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
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando actividad' }, { status: 500 });
  }
}
