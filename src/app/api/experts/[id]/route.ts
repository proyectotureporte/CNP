import { NextRequest, NextResponse } from 'next/server';
import { expert } from '@/lib/db';
import { triggerEvent } from '@/lib/pusher/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const found = await expert.getExpertById(id);
    if (!found) {
      return NextResponse.json({ success: false, error: 'Perito no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: found });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo perito' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await expert.getExpertById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Perito no encontrado' }, { status: 404 });
    }

    const {
      disciplines, specialization, experienceYears, professionalCard,
      city, region, baseFee, feeCurrency, taxId,
      bankName, bankAccountType, bankAccountNumber,
    } = body;

    const updated = await expert.updateExpert(id, {
      disciplines, specialization, experienceYears, professionalCard,
      city, region, baseFee, feeCurrency, taxId, bankName, bankAccountNumber,
      bankAccountType: bankAccountType === undefined ? undefined : (bankAccountType || null),
    });

    triggerEvent('expert:updated', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando perito' }, { status: 500 });
  }
}
