import { NextRequest, NextResponse } from 'next/server';
import { deliverable } from '@/lib/db';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/pusher/server';
import type { DeliverablePhase } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deliverables = await deliverable.listCaseDeliverables(id);
    return NextResponse.json({ success: true, data: deliverables });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo entregas' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const body = await request.json();

    if (!body.phase) {
      return NextResponse.json({ success: false, error: 'Fase requerida' }, { status: 400 });
    }

    const count = await deliverable.countCaseDeliverables(id);
    const phaseMap: Record<string, number> = { marco_conceptual: 1, desarrollo_tecnico: 2, dictamen_final: 3 };

    const created = await deliverable.createDeliverable({
      caseId: id,
      phase: body.phase as DeliverablePhase,
      phaseNumber: phaseMap[body.phase] || count + 1,
      fileName: body.fileName || '',
      status: 'enviado',
      comments: body.comments || '',
      version: 1,
      submittedById: userId && userId !== 'admin' ? userId : null,
    });

    logCaseEvent({
      caseId: id,
      eventType: 'deliverable_submitted',
      description: `Entrega enviada: fase "${body.phase}", v1`,
      userId, userName,
    });

    triggerEvent('deliverable:created', { caseId: id });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando entrega' }, { status: 500 });
  }
}
