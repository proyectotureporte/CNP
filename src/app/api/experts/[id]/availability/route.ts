import { NextRequest, NextResponse } from 'next/server';
import { expert } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import type { ExpertAvailability } from '@/lib/types';
import { guardRole } from '@/lib/auth/guard';
import { canAssignExpert } from '@/lib/auth/permissions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canAssignExpert);
    if (stop) return stop;

    const body = await request.json();
    const { availability } = body;

    if (!availability || !['disponible', 'ocupado', 'no_disponible'].includes(availability)) {
      return NextResponse.json(
        { success: false, error: 'Disponibilidad debe ser "disponible", "ocupado" o "no_disponible"' },
        { status: 400 }
      );
    }

    const existing = await expert.getExpertById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Perito no encontrado' }, { status: 404 });
    }

    const updated = await expert.updateExpert(id, { availability: availability as ExpertAvailability });

    triggerEvent('expert:updated', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando disponibilidad' }, { status: 500 });
  }
}
