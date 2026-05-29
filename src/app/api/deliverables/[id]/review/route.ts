import { NextRequest, NextResponse } from 'next/server';
import { deliverable } from '@/lib/db';
import type { DeliverableStatus } from '@/lib/types';
import { triggerEvent } from '@/lib/realtime/server';

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

    const existing = await deliverable.getDeliverableById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Entrega no encontrada' }, { status: 404 });

    if (action === 'rechazado' && !rejectionReason) {
      return NextResponse.json({ success: false, error: 'Razon de rechazo requerida' }, { status: 400 });
    }

    const reviewerId = userId && userId !== 'admin' ? userId : null;
    const updated = await deliverable.updateDeliverable(id, {
      status: action as DeliverableStatus,
      rejectionReason: action === 'rechazado' ? rejectionReason : undefined,
      approvedById: action === 'aprobado' ? reviewerId : undefined,
      reviewedById: reviewerId,
    });

    triggerEvent('deliverable:reviewed', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error revisando entrega' }, { status: 500 });
  }
}
