import { NextRequest, NextResponse } from 'next/server';
import { cases, crmUser, expert } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { guardRole } from '@/lib/auth/guard';
import { canAssignExpert } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { notifyUsers } from '@/lib/notify';
import { auditEntityChange } from '@/lib/audit';

type AssignRole = 'assignedExpert' | 'associatedExpert' | 'assignedFinanciero';

const VALID_ASSIGN_ROLES: AssignRole[] = ['assignedExpert', 'associatedExpert', 'assignedFinanciero'];

const ROLE_FIELD: Record<Exclude<AssignRole, 'associatedExpert'>, 'assignedExpertId' | 'assignedFinancieroId'> = {
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
    const assignRole = role as AssignRole;

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

    if (['assignedExpert', 'associatedExpert'].includes(assignRole) && user.role !== 'perito') {
      return NextResponse.json({ success: false, error: 'El usuario asignado debe tener rol perito' }, { status: 400 });
    }
    if (assignRole === 'assignedFinanciero' && user.role !== 'perito_interno') {
      return NextResponse.json({ success: false, error: 'El usuario no puede asumir esta asignación' }, { status: 400 });
    }
    if (assignRole === 'assignedFinanciero' && !['financiero', 'contable'].includes(existing.discipline)) {
      return NextResponse.json(
        { success: false, error: 'El perito interno solo recibe casos financieros o contables' },
        { status: 409 },
      );
    }

    // G-01: ningún perito entra en producción sin una cuenta pagable completa.
    if (user.role === 'perito' && ['assignedExpert', 'associatedExpert'].includes(assignRole)) {
      const assignable = assignRole === 'associatedExpert'
        ? await expert.isAssignableExpert(userId)
        : await expert.isAssignableExpertForDiscipline(userId, existing.discipline);
      if (!assignable) {
        return NextResponse.json(
          {
            success: false,
            error: assignRole === 'associatedExpert'
              ? 'No se puede asociar al perito: debe estar activado, disponible y tener sus datos bancarios completos.'
              : 'No se puede asignar el caso: el perito líder debe estar activado, disponible, habilitado para la disciplina principal y tener sus datos bancarios completos.',
          },
          { status: 409 },
        );
      }
    }

    if (assignRole === 'associatedExpert' && !existing.assignedExpert) {
      return NextResponse.json(
        { success: false, error: 'Asigna primero el perito líder del caso' },
        { status: 409 },
      );
    }
    if (assignRole === 'associatedExpert' && existing.assignedExpert?._id === userId) {
      return NextResponse.json(
        { success: false, error: 'El perito líder no puede duplicarse como asociado' },
        { status: 409 },
      );
    }
    if (assignRole === 'associatedExpert' && existing.associatedExperts?.some((item) => item._id === userId)) {
      return NextResponse.json(
        { success: false, error: 'El perito ya pertenece al equipo asociado' },
        { status: 409 },
      );
    }

    const assignmentPatch: Parameters<typeof cases.updateCase>[1] = {};
    if (assignRole !== 'associatedExpert') assignmentPatch[ROLE_FIELD[assignRole]] = userId;
    if (assignRole === 'assignedExpert') {
      assignmentPatch.assignedFinancieroId = null;
      await cases.removeAssociatedExpert(id, userId);
    }
    if (assignRole === 'assignedFinanciero') {
      assignmentPatch.assignedExpertId = null;
      await cases.clearAssociatedExperts(id);
    }
    // Los casos históricos pueden no tener interlocutor tras la unificación de
    // roles. El Comercial Jurídico que hace la primera asignación queda como
    // responsable para que cliente y perito tengan un canal operativo.
    if (!existing.assignedJuridico) assignmentPatch.assignedJuridicoId = request.headers.get('x-user-id');
    if (assignRole === 'associatedExpert') {
      await cases.addAssociatedExpert(id, userId, request.headers.get('x-user-id'));
    }
    const updated = Object.keys(assignmentPatch).length > 0
      ? await cases.updateCase(id, assignmentPatch)
      : await cases.getCaseById(id);

    const actorId = request.headers.get('x-user-id');
    const actorName = request.headers.get('x-user-name');
    const roleLabel = ({
      assignedExpert: 'perito externo',
      associatedExpert: 'perito asociado',
      assignedFinanciero: 'perito interno',
    } as Record<AssignRole, string>)[assignRole];

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
      before: assignRole === 'associatedExpert'
        ? { associatedExpertIds: existing.associatedExperts?.map((item) => item._id) ?? [] }
        : { [ROLE_FIELD[assignRole]]: existing[assignRole]?._id ?? null },
      after: assignRole === 'associatedExpert'
        ? { associatedExpertIds: updated?.associatedExperts?.map((item) => item._id) ?? [] }
        : { [ROLE_FIELD[assignRole]]: userId },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const stop = guardRole(request, canAssignExpert);
    if (stop) return stop;
    const { id } = await params;
    const body = await request.json();
    const userId = String(body.userId || '');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId es requerido' }, { status: 400 });
    }
    const existing = await cases.getCaseById(id);
    const expertToRemove = existing?.associatedExperts?.find((item) => item._id === userId);
    if (!existing || !expertToRemove) {
      return NextResponse.json({ success: false, error: 'Perito asociado no encontrado' }, { status: 404 });
    }
    await cases.removeAssociatedExpert(id, userId);
    const updated = await cases.getCaseById(id);
    logCaseEvent({
      caseId: id,
      eventType: 'assignment',
      description: `${expertToRemove.displayName} retirado del equipo de peritos asociados`,
      userId: request.headers.get('x-user-id'),
      userName: request.headers.get('x-user-name'),
    });
    auditEntityChange({
      request,
      action: 'update',
      entityType: 'case',
      entityId: id,
      before: { associatedExpertIds: existing.associatedExperts?.map((item) => item._id) ?? [] },
      after: { associatedExpertIds: updated?.associatedExperts?.map((item) => item._id) ?? [] },
    });
    triggerEvent('case:assigned', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error retirando el perito asociado' }, { status: 500 });
  }
}
