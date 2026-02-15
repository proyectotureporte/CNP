import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getWorkPlanByIdQuery } from '@/lib/sanity/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const existing = await client.fetch(getWorkPlanByIdQuery, { id });
    if (!existing) return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    if (existing.status !== 'enviado' && existing.status !== 'en_revision') {
      return NextResponse.json({ success: false, error: 'Solo se pueden aprobar planes enviados' }, { status: 400 });
    }
    const updateData: Record<string, unknown> = { status: 'aprobado' };
    if (userId && userId !== 'admin') {
      updateData.committeeApprovedBy = { _type: 'reference', _ref: userId };
    }
    const updated = await writeClient.patch(id).set(updateData).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error aprobando plan' }, { status: 500 });
  }
}
