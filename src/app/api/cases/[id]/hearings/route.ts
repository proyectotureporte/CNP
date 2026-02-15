import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listCaseHearingsQuery } from '@/lib/sanity/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hearings = await client.fetch(listCaseHearingsQuery, { caseId: id });
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

    const doc: { _type: 'hearing'; [key: string]: unknown } = {
      _type: 'hearing',
      case: { _type: 'reference', _ref: id },
      scheduledDate: body.scheduledDate,
      location: body.location || '',
      courtName: body.courtName || '',
      judgeName: body.judgeName || '',
      expertAttended: false,
      clientAttended: false,
      result: 'pendiente',
      notes: body.notes || '',
      followUpRequired: false,
    };

    const created = await writeClient.create(doc);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando audiencia' }, { status: 500 });
  }
}
