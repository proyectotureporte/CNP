import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getCaseWorkPlanQuery, getCaseByIdQuery } from '@/lib/sanity/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workPlan = await client.fetch(getCaseWorkPlanQuery, { caseId: id });
    return NextResponse.json({ success: true, data: workPlan });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo plan de trabajo' }, { status: 500 });
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

    const caseData = await client.fetch(getCaseByIdQuery, { id });
    if (!caseData) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    const doc: { _type: 'workPlan'; [key: string]: unknown } = {
      _type: 'workPlan',
      case: { _type: 'reference', _ref: id },
      methodology: body.methodology || '',
      objectives: body.objectives || '',
      startDate: body.startDate || undefined,
      endDate: body.endDate || undefined,
      estimatedDays: body.estimatedDays || 0,
      deliverablesDescription: body.deliverablesDescription || '',
      status: 'borrador',
    };

    if (body.assignedExpert) {
      doc.assignedExpert = { _type: 'reference', _ref: body.assignedExpert };
    }
    if (userId && userId !== 'admin') {
      doc.createdBy = { _type: 'reference', _ref: userId };
    }

    const created = await writeClient.create(doc);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando plan de trabajo' }, { status: 500 });
  }
}
