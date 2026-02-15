import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getHearingByIdQuery } from '@/lib/sanity/queries';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await client.fetch(getHearingByIdQuery, { id });
    if (!existing) return NextResponse.json({ success: false, error: 'Audiencia no encontrada' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (body.result !== undefined) updateData.result = body.result;
    if (body.expertAttended !== undefined) updateData.expertAttended = body.expertAttended;
    if (body.clientAttended !== undefined) updateData.clientAttended = body.clientAttended;
    if (body.durationMinutes !== undefined) updateData.durationMinutes = body.durationMinutes;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.followUpRequired !== undefined) updateData.followUpRequired = body.followUpRequired;

    const updated = await writeClient.patch(id).set(updateData).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando audiencia' }, { status: 500 });
  }
}
