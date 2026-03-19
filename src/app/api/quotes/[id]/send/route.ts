import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getQuoteByIdQuery } from '@/lib/sanity/queries';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import type { Quote } from '@/lib/types';
import { triggerEvent } from '@/lib/pusher/server';

type QuoteWithCase = Quote & { case?: { _id: string; caseCode: string; title: string } };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');

    const existing = await client.fetch<QuoteWithCase | null>(getQuoteByIdQuery, { id });
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

    if (existing.case?._id) {
      await logCaseEvent({
        caseId: existing.case._id,
        eventType: 'other',
        description: 'Cotizacion enviada',
        userId,
        userName,
      });
    }

    triggerEvent('quote:sent', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error enviando cotizacion' },
      { status: 500 }
    );
  }
}
