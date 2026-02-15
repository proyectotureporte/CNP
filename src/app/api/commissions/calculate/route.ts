import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getCaseEvaluationQuery } from '@/lib/sanity/queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { expertId, caseId, baseAmount } = body;
    if (!expertId || !caseId || !baseAmount) {
      return NextResponse.json({ success: false, error: 'expertId, caseId y baseAmount son requeridos' }, { status: 400 });
    }

    const evaluation = await client.fetch(getCaseEvaluationQuery, { caseId });
    let bonusPercentage = 0;
    let penaltyPercentage = 0;

    if (evaluation) {
      if (evaluation.finalScore >= 4.5) bonusPercentage = 10;
      else if (evaluation.finalScore >= 4.0) bonusPercentage = 5;
      else if (evaluation.finalScore < 3.0) penaltyPercentage = 10;
      else if (evaluation.finalScore < 2.0) penaltyPercentage = 20;
    }

    const bonus = baseAmount * bonusPercentage / 100;
    const penalty = baseAmount * penaltyPercentage / 100;
    const finalAmount = baseAmount + bonus - penalty;

    const doc: { _type: 'commission'; [key: string]: unknown } = {
      _type: 'commission',
      expert: { _type: 'reference', _ref: expertId },
      case: { _type: 'reference', _ref: caseId },
      baseAmount, bonusPercentage, penaltyPercentage, finalAmount,
      status: 'pendiente',
    };

    const created = await writeClient.create(doc);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error calculando comision' }, { status: 500 });
  }
}
