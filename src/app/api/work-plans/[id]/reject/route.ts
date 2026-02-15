import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getWorkPlanByIdQuery } from '@/lib/sanity/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.rejectionComments) {
      return NextResponse.json({ success: false, error: 'Comentarios de rechazo requeridos' }, { status: 400 });
    }
    const existing = await client.fetch(getWorkPlanByIdQuery, { id });
    if (!existing) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    const updated = await writeClient.patch(id).set({ status: 'rechazado', rejectionComments: body.rejectionComments }).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error rechazando plan' }, { status: 500 });
  }
}
