import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getExpertByIdQuery } from '@/lib/sanity/queries';
import type { Expert } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expert = await client.fetch<Expert | null>(getExpertByIdQuery, { id });
    if (!expert) {
      return NextResponse.json({ success: false, error: 'Perito no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: expert });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo perito' },
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

    const existing = await client.fetch<Expert | null>(getExpertByIdQuery, { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Perito no encontrado' }, { status: 404 });
    }

    const {
      disciplines, specialization, experienceYears, professionalCard,
      city, region, baseFee, feeCurrency, taxId,
      bankName, bankAccountType, bankAccountNumber,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (disciplines !== undefined) updateData.disciplines = disciplines;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (experienceYears !== undefined) updateData.experienceYears = experienceYears;
    if (professionalCard !== undefined) updateData.professionalCard = professionalCard;
    if (city !== undefined) updateData.city = city;
    if (region !== undefined) updateData.region = region;
    if (baseFee !== undefined) updateData.baseFee = baseFee;
    if (feeCurrency !== undefined) updateData.feeCurrency = feeCurrency;
    if (taxId !== undefined) updateData.taxId = taxId;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (bankAccountType !== undefined) updateData.bankAccountType = bankAccountType;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;

    const updated = await writeClient.patch(id).set(updateData).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando perito' },
      { status: 500 }
    );
  }
}
