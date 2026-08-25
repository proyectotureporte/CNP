import { NextRequest, NextResponse } from 'next/server';
import { evaluation } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { guardRole } from '@/lib/auth/guard';
import { canManageEvaluations } from '@/lib/auth/permissions';
import { requireCaseAccess } from '@/lib/auth/caseAccess';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!canManageEvaluations(access.actor.role, access.actor.allRoles)) return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    const eval_ = await evaluation.getCaseEvaluation(id);
    return NextResponse.json({ success: true, data: eval_ });
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

    const stop = guardRole(request, canManageEvaluations);
    if (stop) return stop;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;

    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const { expertId, punctualityScore, qualityScore, serviceScore, clientFeedback, technicalFeedback } = body;

    if (!punctualityScore || !qualityScore || !serviceScore) {
      return NextResponse.json({ success: false, error: 'Todos los puntajes son requeridos' }, { status: 400 });
    }

    const finalScore = Math.round(((punctualityScore + qualityScore + serviceScore) / 3) * 10) / 10;

    const created = await evaluation.createEvaluation({
      caseId: id,
      expertId: expertId || null,
      punctualityScore, qualityScore, serviceScore, finalScore,
      clientFeedback: clientFeedback || '',
      technicalFeedback: technicalFeedback || '',
      evaluatedById: userId && userId !== 'admin' ? userId : null,
    });

    triggerEvent('evaluation:created', { caseId: id });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando evaluacion' }, { status: 500 });
  }
}
