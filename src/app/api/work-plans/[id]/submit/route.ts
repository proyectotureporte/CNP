import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getWorkPlanByIdQuery } from '@/lib/sanity/queries';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await client.fetch(getWorkPlanByIdQuery, { id });
    if (!existing) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    if (existing.status !== 'borrador' && existing.status !== 'rechazado') {
      return NextResponse.json({ success: false, error: 'Solo se pueden enviar planes en borrador' }, { status: 400 });
    }
    const updated = await writeClient.patch(id).set({ status: 'enviado', submittedAt: new Date().toISOString() }).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error enviando plan' }, { status: 500 });
  }
}
