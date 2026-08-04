import { NextRequest, NextResponse } from 'next/server';
import { crmUser, workPlanActivity } from '@/lib/db';
import { ACTIVITY_STATUSES, ACTIVITY_STATUS_LABELS, type ActivityStatus } from '@/lib/types';
import { canEditWorkPlan } from '@/lib/auth/permissions';
import { requireCaseAccess, sanitizeActivityForRole } from '@/lib/auth/caseAccess';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const context = await workPlanActivity.getActivityContext(id);
    if (!context) return NextResponse.json({ success: false, error: 'Actividad no encontrada' }, { status: 404 });
    const access = await requireCaseAccess(request, context.caseId);
    if (access.response) return access.response;
    if (!canEditWorkPlan(access.actor.role)) return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    const userId = access.actor.userId;
    const userName = access.actor.displayName;
    const body = await request.json();

    if (access.actor.role === 'perito') {
      const changesStructure = ['title', 'description', 'dueDate', 'assignedTo']
        .some((field) => body[field] !== undefined);
      if (changesStructure && !['borrador', 'rechazado'].includes(context.workPlanStatus || '')) {
        return NextResponse.json(
          { success: false, error: 'La estructura solo se edita mientras el plan esté en borrador o devuelto' },
          { status: 409 },
        );
      }
      if (body.status !== undefined && context.workPlanStatus !== 'aprobado') {
        return NextResponse.json(
          { success: false, error: 'El estado de la labor se actualiza cuando el plan esté aprobado' },
          { status: 409 },
        );
      }
    }

    const existing = await workPlanActivity.getActivityById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Actividad no encontrada' }, { status: 404 });
    }

    const patch: Parameters<typeof workPlanActivity.updateActivity>[1] = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.dueDate !== undefined) patch.dueDate = body.dueDate || null;
    if (body.status !== undefined) {
      if (!ACTIVITY_STATUSES.includes(body.status as ActivityStatus)) {
        return NextResponse.json({ success: false, error: 'Estado de actividad no válido' }, { status: 400 });
      }
      patch.status = body.status;
      if (body.status === 'en_progreso' && !existing.startedAt) {
        patch.startedAt = new Date().toISOString();
      }
      if (body.status === 'completada') {
        patch.completedAt = new Date().toISOString();
        if (!existing.startedAt) patch.startedAt = new Date().toISOString();
      } else {
        patch.completedAt = null;
      }
      if (body.status === 'pendiente') {
        patch.startedAt = null;
        patch.completedAt = null;
      }
    }
    if (body.assignedTo !== undefined) {
      if (access.actor.role !== 'perito' && body.assignedTo) {
        const assignee = await crmUser.getUserById(body.assignedTo);
        if (!assignee || assignee.role === 'cliente') {
          return NextResponse.json({ success: false, error: 'La actividad no puede asignarse a un cliente final' }, { status: 400 });
        }
      }
      patch.assignedToId = access.actor.role === 'perito'
        ? access.actor.userId
        : (body.assignedTo || null);
    }

    const updated = await workPlanActivity.updateActivity(id, patch);

    if (body.status !== undefined && body.status !== existing.status) {
      const oldLabel = ACTIVITY_STATUS_LABELS[existing.status as ActivityStatus] || existing.status;
      const newLabel = ACTIVITY_STATUS_LABELS[body.status as ActivityStatus] || body.status;
      logCaseEvent({
        caseId: context.caseId,
        eventType: 'other',
        description: `Actividad "${existing.title}": ${oldLabel} → ${newLabel}`,
        userId, userName,
      });
    }

    triggerEvent('activity:updated', { id });

    return NextResponse.json({
      success: true,
      data: updated && sanitizeActivityForRole(updated, access.actor.role),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando actividad' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const context = await workPlanActivity.getActivityContext(id);
    if (!context) return NextResponse.json({ success: false, error: 'Actividad no encontrada' }, { status: 404 });
    const access = await requireCaseAccess(request, context.caseId);
    if (access.response) return access.response;
    if (!canEditWorkPlan(access.actor.role)) return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    if (access.actor.role === 'perito' && !['borrador', 'rechazado'].includes(context.workPlanStatus || '')) {
      return NextResponse.json(
        { success: false, error: 'Solo puedes eliminar actividades mientras el plan esté en borrador o devuelto' },
        { status: 409 },
      );
    }
    const userId = access.actor.userId;
    const userName = access.actor.displayName;

    const existing = await workPlanActivity.getActivityById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Actividad no encontrada' }, { status: 404 });
    }
    await workPlanActivity.deleteActivity(id);

    logCaseEvent({
      caseId: context.caseId,
      eventType: 'other',
      description: `Actividad eliminada: "${existing.title}"`,
      userId, userName,
    });

    triggerEvent('activity:deleted', { id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Error eliminando actividad' }, { status: 500 });
  }
}
