import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getCaseByIdQuery, getCrmUserByIdQuery } from '@/lib/sanity/queries';
import type { CaseExpanded, CrmUser } from '@/lib/types';

type AssignRole = 'commercial' | 'technicalAnalyst' | 'assignedExpert';

const VALID_ASSIGN_ROLES: AssignRole[] = ['commercial', 'technicalAnalyst', 'assignedExpert'];

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
      return NextResponse.json(
        { success: false, error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Verify case exists
    const existing = await client.fetch<CaseExpanded | null>(getCaseByIdQuery, { id });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Caso no encontrado' },
        { status: 404 }
      );
    }

    // Verify user exists
    const user = await client.fetch<CrmUser | null>(getCrmUserByIdQuery, { id: userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const updated = await writeClient
      .patch(id)
      .set({ [role]: { _type: 'reference', _ref: userId } })
      .commit();

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
