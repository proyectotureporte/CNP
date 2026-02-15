import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getCaseEvaluationQuery } from '@/lib/sanity/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evaluation = await client.fetch(getCaseEvaluationQuery, { caseId: id });
    return NextResponse.json({ success: true, data: evaluation });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo evaluacion' }, { status: 500 });
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
    const { expertId, punctualityScore, qualityScore, serviceScore, clientFeedback, technicalFeedback } = body;

    if (!punctualityScore || !qualityScore || !serviceScore) {
      return NextResponse.json({ success: false, error: 'Todos los puntajes son requeridos' }, { status: 400 });
    }

    const finalScore = Math.round(((punctualityScore + qualityScore + serviceScore) / 3) * 10) / 10;

    const doc: { _type: 'evaluation'; [key: string]: unknown } = {
      _type: 'evaluation',
      case: { _type: 'reference', _ref: id },
      punctualityScore, qualityScore, serviceScore, finalScore,
      clientFeedback: clientFeedback || '',
      technicalFeedback: technicalFeedback || '',
    };

    if (expertId) doc.expert = { _type: 'reference', _ref: expertId };
    if (userId && userId !== 'admin') doc.evaluatedBy = { _type: 'reference', _ref: userId };

    const created = await writeClient.create(doc);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando evaluacion' }, { status: 500 });
  }
}
