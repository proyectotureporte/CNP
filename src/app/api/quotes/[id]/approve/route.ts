import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getQuoteByIdQuery } from '@/lib/sanity/queries';
import type { Quote } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');

    const existing = await client.fetch<Quote | null>(getQuoteByIdQuery, { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }

    if (existing.status !== 'enviada') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden aprobar cotizaciones enviadas' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status: 'aprobada',
      approvedAt: new Date().toISOString(),
    };

    if (userId && userId !== 'admin') {
      updateData.approvedBy = { _type: 'reference', _ref: userId };
    }

    const updated = await writeClient
      .patch(id)
      .set(updateData)
      .commit();

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error aprobando cotizacion' },
      { status: 500 }
    );
  }
}
