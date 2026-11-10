import { NextRequest, NextResponse } from 'next/server';
import { caseLawyer, crmUser } from '@/lib/db';
import { actorUserReference, requireCaseAccess } from '@/lib/auth/caseAccess';
import { canEditCase } from '@/lib/auth/permissions';
import { hashPassword } from '@/lib/auth/passwords';
import { sendCredentialsEmail } from '@/lib/email';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { auditEntityChange } from '@/lib/audit';
import { notifyUsers } from '@/lib/notify';
import { triggerEvent } from '@/lib/realtime/server';

const MANAGER_ROLES = ['comercial_juridico', 'junta', 'admin'];

function canView(role: string, allRoles: boolean) {
  return allRoles || MANAGER_ROLES.includes(role);
}

/** Abogados con acceso al caso + catálogo de abogados registrados (para el selector). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!canView(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    const [assigned, available] = await Promise.all([
      caseLawyer.listCaseLawyers(id),
      caseLawyer.listLawyerUsers(),
    ]);
    return NextResponse.json({ success: true, data: { assigned, available } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo abogados' }, { status: 500 });
  }
}

/**
 * Da acceso a un abogado. Si llega `userId` se usa esa cuenta; si llega
 * `email` + `displayName` se crea la cuenta (rol abogado) y se le envían las
 * credenciales del portal por correo.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!canEditCase(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    let userId = typeof body.userId === 'string' ? body.userId : '';
    let created = false;

    if (!userId) {
      const email = String(body.email || '').trim().toLowerCase();
      const displayName = String(body.displayName || '').trim();
      const phone = String(body.phone || '').trim();
      if (!/^\S+@\S+\.\S+$/.test(email) || displayName.length < 2) {
        return NextResponse.json({ success: false, error: 'Indica nombre y correo válidos del abogado' }, { status: 400 });
      }
      const existing = await crmUser.getAnyUserByEmail(email);
      if (existing) {
        if (existing.role !== 'abogado') {
          return NextResponse.json({ success: false, error: 'Ese correo pertenece a una cuenta que no es de abogado' }, { status: 409 });
        }
        userId = existing._id;
        if (!existing.active) await crmUser.updateUser(existing._id, { active: true });
      } else {
        const password = `CNP${Math.random().toString(36).slice(2, 10)}`;
        const user = await crmUser.createUser({
          username: email,
          email,
          displayName,
          phone,
          passwordHash: await hashPassword(password),
          role: 'abogado',
          active: true,
          mustChangePassword: true,
        });
        if (!user) throw new Error('No fue posible crear la cuenta');
        userId = user._id;
        created = true;
        sendCredentialsEmail({ to: email, clientName: displayName, username: email, password })
          .catch((err) => console.error('[case-lawyers] Error enviando credenciales:', err));
      }
    } else {
      const user = await crmUser.getUserById(userId);
      if (!user || user.role !== 'abogado') {
        return NextResponse.json({ success: false, error: 'La cuenta indicada no es de un abogado' }, { status: 400 });
      }
    }

    await caseLawyer.addCaseLawyer(id, userId, actorUserReference(access.actor));
    const lawyer = await crmUser.getUserById(userId);
    logCaseEvent({
      caseId: id,
      eventType: 'other',
      title: 'Abogado con acceso al caso',
      description: `Se autorizó a ${lawyer?.displayName || 'un abogado'} para consultar el seguimiento del caso`,
      isVisibleToClient: false,
      userId: access.actor.userId,
      userName: access.actor.displayName,
    });
    auditEntityChange({
      request, action: 'create', entityType: 'case_lawyer', entityId: `${id}:${userId}`, caseId: id,
      after: { abogado: lawyer?.displayName ?? userId, email: lawyer?.email ?? null, cuentaCreada: created },
    });
    notifyUsers({
      userIds: [userId],
      title: 'Tienes acceso a un nuevo caso',
      message: `Puedes consultar el seguimiento del caso ${access.row.caseId ? '' : ''}en tu portal.`,
      linkUrl: `/portal/cases/${id}`,
    }).catch(() => {});
    triggerEvent('case:updated', { id });

    return NextResponse.json({ success: true, data: { assigned: await caseLawyer.listCaseLawyers(id), created } }, { status: 201 });
  } catch (error) {
    console.error('[case-lawyers] POST error:', error);
    return NextResponse.json({ success: false, error: 'Error autorizando al abogado' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!canEditCase(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    const userId = request.nextUrl.searchParams.get('userId') || '';
    if (!userId) return NextResponse.json({ success: false, error: 'Falta el abogado' }, { status: 400 });
    const lawyer = await crmUser.getUserById(userId);
    await caseLawyer.removeCaseLawyer(id, userId);
    logCaseEvent({
      caseId: id,
      eventType: 'other',
      title: 'Acceso de abogado retirado',
      description: `Se retiró el acceso de ${lawyer?.displayName || 'un abogado'} al caso`,
      isVisibleToClient: false,
      userId: access.actor.userId,
      userName: access.actor.displayName,
    });
    auditEntityChange({
      request, action: 'delete', entityType: 'case_lawyer', entityId: `${id}:${userId}`, caseId: id,
      before: { abogado: lawyer?.displayName ?? userId },
    });
    triggerEvent('case:updated', { id });
    return NextResponse.json({ success: true, data: { assigned: await caseLawyer.listCaseLawyers(id) } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error retirando el acceso' }, { status: 500 });
  }
}
