import { NextRequest, NextResponse } from 'next/server';
import { expert } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { guardRole } from '@/lib/auth/guard';
import { canManageExperts, hasPermission } from '@/lib/auth/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const stop = guardRole(request, (role) => hasPermission(role, 'experts'));
    if (stop) return stop;
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

    const stop = guardRole(request, canManageExperts);
    if (stop) return stop;

    const body = await request.json();

    const existing = await expert.getExpertById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Perito no encontrado' }, { status: 404 });
    }

    const {
      disciplines, specialization, subespecialidad, experienceYears, professionalCard,
      seniority, category, pregrado, numEspecializaciones, numMaestrias, doctorado,
      city, region, baseFee, feeCurrency, taxId,
      bankName, bankAccountType, bankAccountNumber, bankAccountHolder, bankHolderDocument,
    } = body;

    const updated = await expert.updateExpert(id, {
      disciplines, specialization, subespecialidad, experienceYears, professionalCard,
      seniority, category, pregrado, numEspecializaciones, numMaestrias, doctorado,
      city, region, baseFee, feeCurrency, taxId, bankName, bankAccountNumber,
      bankAccountHolder, bankHolderDocument,
      bankAccountType: bankAccountType === undefined ? undefined : (bankAccountType || null),
    });

    triggerEvent('expert:updated', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando perito' }, { status: 500 });
  }
}
