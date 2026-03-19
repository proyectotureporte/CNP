import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listCaseEventsQuery, getCaseByIdQuery } from '@/lib/sanity/queries';
import { verifyClientOwnsCase } from '@/lib/auth/clientAccess';
import { CASE_EVENT_TYPES, type CaseEvent, type CaseEventType, type CaseExpanded } from '@/lib/types';
import { triggerEvent } from '@/lib/pusher/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userRole = request.headers.get('x-user-role') || '';
    const userId = request.headers.get('x-user-id') || '';

    // Portal clients can only view events for their own cases
    if (userRole === 'cliente') {
      const { owns } = await verifyClientOwnsCase(userId, id);
      if (!owns) {
        return NextResponse.json(
          { success: false, error: 'No tiene acceso a este caso' },
          { status: 403 }
        );
      }
    }

    const events = await client.fetch<CaseEvent[]>(listCaseEventsQuery, { caseId: id });
    return NextResponse.json({ success: true, data: events });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo eventos' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { success: false, error: 'Tipo de evento no valido' },
        { status: 400 }
      );
    }

    // Verify case exists
    const existing = await client.fetch<CaseExpanded | null>(getCaseByIdQuery, { id });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Caso no encontrado' },
        { status: 404 }
      );
    }

    const doc: { _type: 'caseEvent'; [key: string]: unknown } = {
      _type: 'caseEvent',
      case: { _type: 'reference', _ref: id },
      eventType,
      description: description || '',
      createdByName: userName || 'Sistema',
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    };

    if (userId && userId !== 'admin') {
      doc.createdBy = { _type: 'reference', _ref: userId };
    }

    const created = await writeClient.create(doc);
    triggerEvent('case:updated', { id });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error creando evento' },
      { status: 500 }
    );
  }
}
