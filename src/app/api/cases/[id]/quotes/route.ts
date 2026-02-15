import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listCaseQuotesQuery, countCaseQuotesQuery, getCaseByIdQuery } from '@/lib/sanity/queries';
import type { Quote, CaseExpanded } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quotes = await client.fetch<Quote[]>(listCaseQuotesQuery, { caseId: id });
    return NextResponse.json({ success: true, data: quotes });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo cotizaciones' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const { estimatedHours, hourlyRate, expenses, marginPercentage, discountPercentage, notes, validUntil } = body;

    // Verify case exists
    const existing = await client.fetch<CaseExpanded | null>(getCaseByIdQuery, { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    if (!estimatedHours || !hourlyRate) {
      return NextResponse.json(
        { success: false, error: 'Horas estimadas y tarifa por hora son requeridas' },
        { status: 400 }
      );
    }

    // Calculate values
    const baseValue = estimatedHours * hourlyRate;
    const totalExpenses = expenses || 0;
    const margin = marginPercentage || 30;
    const totalValue = baseValue + totalExpenses + (baseValue * margin / 100);
    const discount = discountPercentage || 0;
    const finalValue = totalValue - (totalValue * discount / 100);

    // Get next version number
    const count = await client.fetch<number>(countCaseQuotesQuery, { caseId: id });

    const doc: { _type: 'quote'; [key: string]: unknown } = {
      _type: 'quote',
      case: { _type: 'reference', _ref: id },
      version: count + 1,
      estimatedHours,
      hourlyRate,
      baseValue,
      expenses: totalExpenses,
      marginPercentage: margin,
      totalValue,
      discountPercentage: discount,
      finalValue,
      status: 'borrador',
      notes: notes || '',
      validUntil: validUntil || undefined,
    };

    if (userId && userId !== 'admin') {
      doc.createdBy = { _type: 'reference', _ref: userId };
    }

    const created = await writeClient.create(doc);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error creando cotizacion' },
      { status: 500 }
    );
  }
}
