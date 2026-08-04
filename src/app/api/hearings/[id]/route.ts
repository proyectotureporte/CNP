import { NextRequest, NextResponse } from 'next/server';
import { hearing } from '@/lib/db';
import type { HearingResult } from '@/lib/types';
import { triggerEvent } from '@/lib/realtime/server';
import { requireCaseAccess } from '@/lib/auth/caseAccess';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await hearing.getHearingById(id) as (Awaited<ReturnType<typeof hearing.getHearingById>> & { case?: { _id: string } }) | null;
    if (!existing) return NextResponse.json({ success: false, error: 'Audiencia no encontrada' }, { status: 404 });
    const caseId = existing.case?._id;
    if (!caseId) return NextResponse.json({ success: false, error: 'Audiencia sin caso asociado' }, { status: 409 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;
    if (!['admin', 'juridico'].includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const updated = await hearing.updateHearing(id, {
      result: body.result as HearingResult | undefined,
      expertAttended: body.expertAttended,
      clientAttended: body.clientAttended,
      durationMinutes: body.durationMinutes,
      notes: body.notes,
      followUpRequired: body.followUpRequired,
    });
    triggerEvent('hearing:updated', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando audiencia' }, { status: 500 });
  }
}
