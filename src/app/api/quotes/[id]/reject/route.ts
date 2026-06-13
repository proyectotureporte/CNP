import { NextRequest, NextResponse } from 'next/server';
import { quote } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { canApproveQuote } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import type { Quote } from '@/lib/types';
import { triggerEvent } from '@/lib/realtime/server';

type QuoteWithCase = Quote & { case?: { _id: string; caseCode: string; title: string } };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canApproveQuote);
    if (stop) return stop;

    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const body = await request.json();
    const { rejectionReason } = body;

    const existing = (await quote.getQuoteById(id)) as QuoteWithCase | null;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }
    if (existing.status !== 'enviada') {
      return NextResponse.json({ success: false, error: 'Solo se pueden rechazar cotizaciones enviadas' }, { status: 400 });
    }
    if (!rejectionReason) {
      return NextResponse.json({ success: false, error: 'La razon de rechazo es requerida' }, { status: 400 });
    }

    const updated = await quote.updateQuote(id, { status: 'rechazada', rejectionReason });

    if (existing.case?._id) {
      await logCaseEvent({
        caseId: existing.case._id,
        eventType: 'quote_rejected',
        description: `Cotizacion rechazada: ${rejectionReason}`,
        userId, userName,
      });
    }

    triggerEvent('quote:rejected', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error rechazando cotizacion' }, { status: 500 });
  }
}
