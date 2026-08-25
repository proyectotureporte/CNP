import { NextRequest, NextResponse } from 'next/server';
import { cases, caseEvent } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import { CASE_EVENT_TYPES, type CaseEventType } from '@/lib/types';
import { triggerEvent } from '@/lib/realtime/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    const events = await caseEvent.listCaseEvents(id);
    const data = events.map((event) => {
      const safe = { ...event };
      if (access.actor.role === 'perito') {
        delete safe.createdBy;
        if (safe.createdByRole === 'cliente') safe.createdByName = 'Cliente final';
      }
      if (access.actor.role === 'cliente') {
        delete safe.createdBy;
        if (safe.createdByRole === 'perito' || safe.createdByRole === 'perito_interno') {
          safe.createdByName = 'Equipo técnico';
        }
        if (safe.eventType === 'assignment') {
          // La descripción histórica incluye el nombre del asignado. Se vuelve
          // genérica para que ninguna variante de rol revele al perito.
          safe.description = 'Equipo responsable del caso actualizado';
        }
      }
      delete safe.createdByRole;
      return safe;
    });
    return NextResponse.json({ success: true, data });
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
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!access.actor.allRoles && access.actor.role !== 'comercial_juridico') {
      return NextResponse.json({ success: false, error: 'La línea de tiempo es de solo lectura para tu rol' }, { status: 403 });
    }
    const userId = access.actor.userId;
    const userName = access.actor.displayName;
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
