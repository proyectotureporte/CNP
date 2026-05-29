import { NextRequest, NextResponse } from 'next/server';
import { hearing } from '@/lib/db';
import type { HearingResult } from '@/lib/types';
import { triggerEvent } from '@/lib/pusher/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await hearing.getHearingById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Audiencia no encontrada' }, { status: 404 });

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
