import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getQuoteByIdQuery } from '@/lib/sanity/queries';
import type { Quote } from '@/lib/types';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await client.fetch<Quote | null>(getQuoteByIdQuery, { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }

    if (existing.status !== 'borrador') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden enviar cotizaciones en borrador' },
        { status: 400 }
      );
    }

    const updated = await writeClient
      .patch(id)
      .set({
        status: 'enviada',
        sentAt: new Date().toISOString(),
      })
      .commit();

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error enviando cotizacion' },
      { status: 500 }
    );
  }
}
