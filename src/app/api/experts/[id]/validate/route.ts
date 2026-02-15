import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getExpertByIdQuery } from '@/lib/sanity/queries';
import type { Expert } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const { action, notes } = body;

    if (!action || !['aprobado', 'rechazado'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Accion debe ser "aprobado" o "rechazado"' },
        { status: 400 }
      );
    }

    if (action === 'rechazado' && !notes) {
      return NextResponse.json(
        { success: false, error: 'Las notas son requeridas para rechazar' },
        { status: 400 }
      );
    }

    const existing = await client.fetch<Expert | null>(getExpertByIdQuery, { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Perito no encontrado' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      validationStatus: action,
      validationNotes: notes || '',
    };

    if (userId && userId !== 'admin') {
      updateData.validatedBy = { _type: 'reference', _ref: userId };
    }

    const updated = await writeClient.patch(id).set(updateData).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error validando perito' },
      { status: 500 }
    );
  }
}
