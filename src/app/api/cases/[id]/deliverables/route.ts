import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listCaseDeliverablesQuery, countCaseDeliverablesQuery } from '@/lib/sanity/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deliverables = await client.fetch(listCaseDeliverablesQuery, { caseId: id });
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
    const body = await request.json();

    if (!body.phase) {
      return NextResponse.json({ success: false, error: 'Fase requerida' }, { status: 400 });
    }

    const count = await client.fetch(countCaseDeliverablesQuery, { caseId: id });
    const phaseMap: Record<string, number> = { marco_conceptual: 1, desarrollo_tecnico: 2, dictamen_final: 3 };

    const doc: { _type: 'deliverable'; [key: string]: unknown } = {
      _type: 'deliverable',
      case: { _type: 'reference', _ref: id },
      phase: body.phase,
      phaseNumber: phaseMap[body.phase] || count + 1,
      fileName: body.fileName || '',
      status: 'enviado',
      comments: body.comments || '',
      version: 1,
    };

    if (userId && userId !== 'admin') {
      doc.submittedBy = { _type: 'reference', _ref: userId };
    }

    const created = await writeClient.create(doc);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando entrega' }, { status: 500 });
  }
}
