import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getWorkPlanByIdQuery } from '@/lib/sanity/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plan = await client.fetch(getWorkPlanByIdQuery, { id });
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
    const existing = await client.fetch(getWorkPlanByIdQuery, { id });
    if (!existing) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    if (existing.status !== 'borrador' && existing.status !== 'rechazado') {
      return NextResponse.json({ success: false, error: 'Solo se pueden editar planes en borrador o rechazados' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.methodology !== undefined) updateData.methodology = body.methodology;
    if (body.objectives !== undefined) updateData.objectives = body.objectives;
    if (body.startDate !== undefined) updateData.startDate = body.startDate;
    if (body.endDate !== undefined) updateData.endDate = body.endDate;
    if (body.estimatedDays !== undefined) updateData.estimatedDays = body.estimatedDays;
    if (body.deliverablesDescription !== undefined) updateData.deliverablesDescription = body.deliverablesDescription;

    const updated = await writeClient.patch(id).set(updateData).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando plan' }, { status: 500 });
  }
}
