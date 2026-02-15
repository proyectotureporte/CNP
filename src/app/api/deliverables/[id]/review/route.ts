import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getDeliverableByIdQuery } from '@/lib/sanity/queries';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!action || !['aprobado', 'rechazado'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Accion debe ser "aprobado" o "rechazado"' }, { status: 400 });
    }

    const existing = await client.fetch(getDeliverableByIdQuery, { id });
    if (!existing) return NextResponse.json({ success: false, error: 'Entrega no encontrada' }, { status: 404 });

    if (action === 'rechazado' && !rejectionReason) {
      return NextResponse.json({ success: false, error: 'Razon de rechazo requerida' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status: action };
    if (action === 'rechazado') updateData.rejectionReason = rejectionReason;
    if (userId && userId !== 'admin') {
      if (action === 'aprobado') updateData.approvedBy = { _type: 'reference', _ref: userId };
      updateData.reviewedBy = { _type: 'reference', _ref: userId };
    }

    const updated = await writeClient.patch(id).set(updateData).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error revisando entrega' }, { status: 500 });
  }
}
