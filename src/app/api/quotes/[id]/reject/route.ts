import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getQuoteByIdQuery } from '@/lib/sanity/queries';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import type { Quote } from '@/lib/types';

type QuoteWithCase = Quote & { case?: { _id: string; caseCode: string; title: string } };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const body = await request.json();
    const { rejectionReason } = body;

    const existing = await client.fetch<QuoteWithCase | null>(getQuoteByIdQuery, { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }

    if (existing.status !== 'enviada') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden rechazar cotizaciones enviadas' },
        { status: 400 }
      );
    }

    if (!rejectionReason) {
      return NextResponse.json(
        { success: false, error: 'La razon de rechazo es requerida' },
        { status: 400 }
      );
    }

    const updated = await writeClient
      .patch(id)
      .set({
        status: 'rechazada',
        rejectionReason,
      })
      .commit();

    if (existing.case?._id) {
      const reasonLabel = rejectionReason ? `: ${rejectionReason}` : '';
      await logCaseEvent({
        caseId: existing.case._id,
        eventType: 'quote_rejected',
        description: `Cotizacion rechazada${reasonLabel}`,
        userId,
        userName,
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error rechazando cotizacion' },
      { status: 500 }
    );
  }
}
