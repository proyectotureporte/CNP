import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getExpertByIdQuery } from '@/lib/sanity/queries';
import type { Expert } from '@/lib/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { availability } = body;

    if (!availability || !['disponible', 'ocupado', 'no_disponible'].includes(availability)) {
      return NextResponse.json(
        { success: false, error: 'Disponibilidad debe ser "disponible", "ocupado" o "no_disponible"' },
        { status: 400 }
      );
    }

    const existing = await client.fetch<Expert | null>(getExpertByIdQuery, { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Perito no encontrado' }, { status: 404 });
    }

    const updated = await writeClient.patch(id).set({ availability }).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando disponibilidad' },
      { status: 500 }
    );
  }
}
