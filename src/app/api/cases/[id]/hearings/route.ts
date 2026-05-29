import { NextRequest, NextResponse } from 'next/server';
import { hearing } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hearings = await hearing.listCaseHearings(id);
    return NextResponse.json({ success: true, data: hearings });
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
