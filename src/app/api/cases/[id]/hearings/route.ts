import { NextRequest, NextResponse } from 'next/server';
import { hearing } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { requireCaseAccess } from '@/lib/auth/caseAccess';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    const hearings = await hearing.listCaseHearings(id);
    const data = hearings.map((item) => ({
      ...item,
      ...(access.actor.role === 'cliente' ? { expertAttended: undefined } : {}),
      ...(access.actor.role === 'perito' ? { clientAttended: undefined } : {}),
    }));
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo audiencias' }, { status: 500 });
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
    if (!['admin', 'juridico'].includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    const body = await request.json();

    if (!body.scheduledDate) {
      return NextResponse.json({ success: false, error: 'Fecha programada requerida' }, { status: 400 });
    }

    const created = await hearing.createHearing({
      caseId: id,
      scheduledDate: body.scheduledDate,
      location: body.location || '',
      courtName: body.courtName || '',
      judgeName: body.judgeName || '',
      expertAttended: false,
      clientAttended: false,
      result: 'pendiente',
      notes: body.notes || '',
      followUpRequired: false,
    });

    triggerEvent('hearing:created', { caseId: id });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando audiencia' }, { status: 500 });
  }
}
