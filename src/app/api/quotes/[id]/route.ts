import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getQuoteByIdQuery, listAllQuotesQuery, countAllQuotesQuery } from '@/lib/sanity/queries';
import type { Quote } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (id === 'list') {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const start = (page - 1) * limit;
      const end = start + limit;
      const [quotes, total] = await Promise.all([
        client.fetch(listAllQuotesQuery, { status, start, end }),
        client.fetch(countAllQuotesQuery, { status }),
      ]);
      return NextResponse.json({ success: true, data: quotes, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    }
    const quote = await client.fetch<Quote | null>(getQuoteByIdQuery, { id });
    if (!quote) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: quote });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo cotizacion' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await client.fetch<Quote | null>(getQuoteByIdQuery, { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Cotizacion no encontrada' }, { status: 404 });
    }

    if (existing.status !== 'borrador') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden editar cotizaciones en borrador' },
        { status: 400 }
      );
    }

    const { estimatedHours, hourlyRate, expenses, marginPercentage, discountPercentage, notes, validUntil } = body;

    const hours = estimatedHours ?? existing.estimatedHours;
    const rate = hourlyRate ?? existing.hourlyRate;
    const exp = expenses ?? existing.expenses;
    const margin = marginPercentage ?? existing.marginPercentage;
    const discount = discountPercentage ?? existing.discountPercentage;

    const baseValue = hours * rate;
    const totalValue = baseValue + exp + (baseValue * margin / 100);
    const finalValue = totalValue - (totalValue * discount / 100);

    const updated = await writeClient
      .patch(id)
      .set({
        estimatedHours: hours,
        hourlyRate: rate,
        baseValue,
        expenses: exp,
        marginPercentage: margin,
        totalValue,
        discountPercentage: discount,
        finalValue,
        notes: notes ?? existing.notes,
        validUntil: validUntil ?? existing.validUntil,
      })
      .commit();

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando cotizacion' },
      { status: 500 }
    );
  }
}
