import { NextRequest, NextResponse } from 'next/server';
import { cases, caseEvent } from '@/lib/db';
import { verifyClientOwnsCase } from '@/lib/auth/clientAccess';
import { CASE_EVENT_TYPES, type CaseEventType } from '@/lib/types';
import { triggerEvent } from '@/lib/pusher/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userRole = request.headers.get('x-user-role') || '';
    const userId = request.headers.get('x-user-id') || '';

    if (userRole === 'cliente') {
      const { owns } = await verifyClientOwnsCase(userId, id);
      if (!owns) {
        return NextResponse.json({ success: false, error: 'No tiene acceso a este caso' }, { status: 403 });
      }
    }

    const events = await caseEvent.listCaseEvents(id);
    return NextResponse.json({ success: true, data: events });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo eventos' }, { status: 500 });
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
    const { eventType, description, metadata } = body;

    if (!eventType || !CASE_EVENT_TYPES.includes(eventType as CaseEventType)) {
      return NextResponse.json({ success: false, error: 'Tipo de evento no valido' }, { status: 400 });
    }

    const existing = await cases.getCaseById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    const createdId = await caseEvent.createCaseEvent({
      caseId: id,
      eventType,
      description: description || '',
      createdById: userId,
      createdByName: userName || 'Sistema',
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    triggerEvent('case:updated', { id });
    return NextResponse.json({ success: true, data: { _id: createdId } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando evento' }, { status: 500 });
  }
}
