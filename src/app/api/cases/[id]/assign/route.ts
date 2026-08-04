import { NextRequest, NextResponse } from 'next/server';
import { cases, crmUser, expert } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { guardRole } from '@/lib/auth/guard';
import { canAssignExpert } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { notifyUsers } from '@/lib/notify';
import { auditEntityChange } from '@/lib/audit';

type AssignRole = 'commercial' | 'technicalAnalyst' | 'assignedExpert' | 'assignedFinanciero' | 'assignedJuridico';

const VALID_ASSIGN_ROLES: AssignRole[] = ['commercial', 'technicalAnalyst', 'assignedExpert', 'assignedFinanciero', 'assignedJuridico'];

const ROLE_FIELD: Record<AssignRole, 'commercialId' | 'technicalAnalystId' | 'assignedExpertId' | 'assignedFinancieroId' | 'assignedJuridicoId'> = {
  commercial: 'commercialId',
  technicalAnalyst: 'technicalAnalystId',
  assignedExpert: 'assignedExpertId',
  assignedFinanciero: 'assignedFinancieroId',
  assignedJuridico: 'assignedJuridicoId',
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canAssignExpert);
    if (stop) return stop;

    const body = await request.json();
    const { role, userId } = body as { role: string; userId: string };

    if (!role || !VALID_ASSIGN_ROLES.includes(role as AssignRole)) {
      return NextResponse.json(
        { success: false, error: 'Rol de asignación no válido' },
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

    if (role === 'assignedJuridico' && user.role !== 'juridico') {
      return NextResponse.json({ success: false, error: 'El interlocutor debe tener rol jurídico' }, { status: 400 });
    }
    if (role === 'assignedExpert' && user.role !== 'perito') {
      return NextResponse.json({ success: false, error: 'El usuario asignado debe tener rol perito' }, { status: 400 });
    }
    if (role === 'assignedFinanciero' && !['financiero', 'perito'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'El usuario no puede asumir esta asignación' }, { status: 400 });
    }

    // G-01: ningún perito entra en producción sin una cuenta pagable completa.
    if (user.role === 'perito' && (role === 'assignedExpert' || role === 'assignedFinanciero')) {
      const expertProfile = await expert.getExpertByUserId(userId);
      if (expertProfile?.validationStatus !== 'activado') {
        return NextResponse.json(
          { success: false, error: 'No se puede asignar el caso: el perfil del perito debe estar activado y categorizado.' },
          { status: 409 },
        );
      }
      const bankingComplete = Boolean(
        expertProfile?.bankName?.trim()
        && expertProfile.bankAccountType?.trim()
        && expertProfile.bankAccountNumber?.trim()
        && expertProfile.bankAccountHolder?.trim()
        && expertProfile.bankHolderDocument?.trim()
      );
      if (!bankingComplete) {
        return NextResponse.json(
          { success: false, error: 'No se puede asignar el caso: el perito debe completar banco, tipo y número de cuenta, titular y documento del titular.' },
          { status: 409 },
        );
      }
    }

    const updated = await cases.updateCase(id, { [ROLE_FIELD[role as AssignRole]]: userId });

    const actorId = request.headers.get('x-user-id');
    const actorName = request.headers.get('x-user-name');
    const roleLabel = ({
      commercial: 'comercial', technicalAnalyst: 'analista técnico', assignedExpert: 'perito',
      assignedFinanciero: 'responsable financiero', assignedJuridico: 'abogado jurídico',
    } as Record<AssignRole, string>)[role as AssignRole];

    logCaseEvent({
      caseId: id,
      eventType: 'assignment',
      description: `${user.displayName} asignado como ${roleLabel}`,
      userId: actorId,
      userName: actorName,
    });

    // RF-13: avisar al asignado.
    notifyUsers({
      userIds: [userId],
      type: 'info',
      priority: 'alta',
      title: `Nueva asignación: ${existing.caseCode}`,
      message: `Has sido asignado como ${roleLabel} del caso "${existing.title}".`,
      linkUrl: `/crm/cases/${id}`,
    }).catch((err) => console.error('[assign] Error notificando asignación:', err));

    auditEntityChange({
      request,
      action: 'update',
      entityType: 'case',
      entityId: id,
      before: { [ROLE_FIELD[role as AssignRole]]: existing[role as AssignRole]?._id ?? null },
      after: { [ROLE_FIELD[role as AssignRole]]: userId },
    });

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
