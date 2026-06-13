import { NextRequest, NextResponse } from 'next/server';
import { evaluation, commission } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { guardRole } from '@/lib/auth/guard';
import { canAccessFinances } from '@/lib/auth/permissions';

export async function POST(request: NextRequest) {
  try {
    const stop = guardRole(request, canAccessFinances);
    if (stop) return stop;

    const body = await request.json();
    const { expertId, caseId, baseAmount } = body;
    if (!expertId || !caseId || !baseAmount) {
      return NextResponse.json({ success: false, error: 'expertId, caseId y baseAmount son requeridos' }, { status: 400 });
    }

    const eval_ = await evaluation.getCaseEvaluation(caseId);
    let bonusPercentage = 0;
    let penaltyPercentage = 0;

    if (eval_) {
      if (eval_.finalScore >= 4.5) bonusPercentage = 10;
      else if (eval_.finalScore >= 4.0) bonusPercentage = 5;
      else if (eval_.finalScore < 3.0) penaltyPercentage = 10;
      else if (eval_.finalScore < 2.0) penaltyPercentage = 20;
    }

    const bonus = baseAmount * bonusPercentage / 100;
    const penalty = baseAmount * penaltyPercentage / 100;
    const finalAmount = baseAmount + bonus - penalty;

    const created = await commission.createCommission({
      expertId, caseId, baseAmount, bonusPercentage, penaltyPercentage, finalAmount, status: 'pendiente',
    });

    triggerEvent('commission:calculated', {});

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error calculando comision' }, { status: 500 });
  }
}
