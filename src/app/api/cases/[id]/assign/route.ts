import { NextRequest, NextResponse } from 'next/server';
import { cases, crmUser } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';

type AssignRole = 'commercial' | 'technicalAnalyst' | 'assignedExpert';

const VALID_ASSIGN_ROLES: AssignRole[] = ['commercial', 'technicalAnalyst', 'assignedExpert'];

const ROLE_FIELD: Record<AssignRole, 'commercialId' | 'technicalAnalystId' | 'assignedExpertId'> = {
  commercial: 'commercialId',
  technicalAnalyst: 'technicalAnalystId',
  assignedExpert: 'assignedExpertId',
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, userId } = body as { role: string; userId: string };

    if (!role || !VALID_ASSIGN_ROLES.includes(role as AssignRole)) {
      return NextResponse.json(
        { success: false, error: 'Rol no valido. Usar: commercial, technicalAnalyst, assignedExpert' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId es requerido' }, { status: 400 });
    }

    const existing = await cases.getCaseById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    const user = await crmUser.getUserById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const updated = await cases.updateCase(id, { [ROLE_FIELD[role as AssignRole]]: userId });

    triggerEvent('case:assigned', { id });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `${role} asignado correctamente`,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error asignando usuario al caso' },
      { status: 500 }
    );
  }
}
