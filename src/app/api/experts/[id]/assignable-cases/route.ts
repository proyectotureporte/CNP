import { NextRequest, NextResponse } from 'next/server';
import { cases, expert } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { canAssignExpert } from '@/lib/auth/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const stop = guardRole(request, canAssignExpert);
    if (stop) return stop;

    const { id } = await params;
    const readiness = await expert.getExpertAssignmentReadiness(id);
    if (!readiness) {
      return NextResponse.json({ success: false, error: 'Perito no encontrado' }, { status: 404 });
    }

    const reasons: string[] = [];
    if (!readiness.userId) reasons.push('El perfil no tiene una cuenta de acceso vinculada.');
    if (readiness.userId && !readiness.userActive) reasons.push('La cuenta del perito está inactiva.');
    if (readiness.userId && readiness.userRole !== 'perito') reasons.push('La cuenta vinculada no tiene el rol perito.');
    if (readiness.validationStatus !== 'activado') reasons.push('El perfil debe estar validado como activado.');
    if (readiness.availability !== 'disponible') reasons.push('El perito debe estar disponible.');
    if (!readiness.bankComplete) reasons.push('Faltan datos bancarios obligatorios para poder pagarle.');

    const availableCases = await cases.listUnassignedCasesForDisciplines(readiness.disciplines);

    return NextResponse.json({
      success: true,
      data: {
        eligible: reasons.length === 0,
        reasons,
        expertUserId: readiness.userId,
        disciplines: readiness.disciplines,
        cases: availableCases,
      },
    });
  } catch (error) {
    console.error('[assignable-cases] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Error obteniendo casos disponibles para el perito' },
      { status: 500 },
    );
  }
}
