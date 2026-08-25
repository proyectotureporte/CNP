import { NextRequest, NextResponse } from 'next/server';
import { cases, crmUser, expert } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { guardRole } from '@/lib/auth/guard';
import { canAssignExpert } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { notifyUsers } from '@/lib/notify';
import { auditEntityChange } from '@/lib/audit';

type AssignRole = 'assignedExpert' | 'assignedFinanciero';

const VALID_ASSIGN_ROLES: AssignRole[] = ['assignedExpert', 'assignedFinanciero'];

const ROLE_FIELD: Record<AssignRole, 'assignedExpertId' | 'assignedFinancieroId'> = {
  assignedExpert: 'assignedExpertId',
  assignedFinanciero: 'assignedFinancieroId',
};

async function assignUser(
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
    if (!user || !user.active) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (role === 'assignedExpert' && user.role !== 'perito') {
      return NextResponse.json({ success: false, error: 'El usuario asignado debe tener rol perito' }, { status: 400 });
    }
    if (role === 'assignedFinanciero' && user.role !== 'perito_interno') {
      return NextResponse.json({ success: false, error: 'El usuario no puede asumir esta asignación' }, { status: 400 });
    }
    if (role === 'assignedFinanciero' && !['financiero', 'contable'].includes(existing.discipline)) {
      return NextResponse.json(
        { success: false, error: 'El perito interno solo recibe casos financieros o contables' },
        { status: 409 },
      );
    }

    // G-01: ningún perito entra en producción sin una cuenta pagable completa.
    if (user.role === 'perito' && role === 'assignedExpert') {
      const assignable = await expert.isAssignableExpertForDiscipline(userId, existing.discipline);
      if (!assignable) {
        return NextResponse.json(
          { success: false, error: 'No se puede asignar el caso: el perito debe estar activado, disponible, habilitado para la disciplina y tener sus datos bancarios completos.' },
          { status: 409 },
        );
      }
    }

    const assignmentPatch: Parameters<typeof cases.updateCase>[1] = {
      [ROLE_FIELD[role as AssignRole]]: userId,
    };
    if (role === 'assignedExpert') assignmentPatch.assignedFinancieroId = null;
    if (role === 'assignedFinanciero') assignmentPatch.assignedExpertId = null;
    // Los casos históricos pueden no tener interlocutor tras la unificación de
    // roles. El Comercial Jurídico que hace la primera asignación queda como
    // responsable para que cliente y perito tengan un canal operativo.
    if (!existing.assignedJuridico) assignmentPatch.assignedJuridicoId = request.headers.get('x-user-id');
    const updated = await cases.updateCase(id, assignmentPatch);

    const actorId = request.headers.get('x-user-id');
    const actorName = request.headers.get('x-user-name');
    const roleLabel = ({
      assignedExpert: 'perito externo',
      assignedFinanciero: 'perito interno',
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

export const POST = assignUser;
export const PUT = assignUser;
