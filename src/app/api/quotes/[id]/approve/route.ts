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

    const existing = await client.fetch<QuoteWithCase | null>(getQuoteByIdQuery, { id });
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

    if (existing.case?._id) {
      const versionLabel = existing.version ? ` v${existing.version}` : '';
      await logCaseEvent({
        caseId: existing.case._id,
        eventType: 'quote_approved',
        description: `Cotizacion${versionLabel} aprobada`,
        userId,
        userName,
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error aprobando cotizacion' },
      { status: 500 }
    );
  }
}
