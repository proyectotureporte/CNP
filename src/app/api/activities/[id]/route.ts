import { NextRequest, NextResponse } from 'next/server';
import { workPlanActivity } from '@/lib/db';
import { ACTIVITY_STATUS_LABELS, type ActivityStatus } from '@/lib/types';
import { guardRole } from '@/lib/auth/guard';
import { canManageWorkPlanActions } from '@/lib/auth/permissions';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canManageWorkPlanActions);
    if (stop) return stop;

    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const body = await request.json();

    const existing = await workPlanActivity.getActivityById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Actividad no encontrada' }, { status: 404 });
    }
    const caseId = await workPlanActivity.getActivityCaseId(id);

    const patch: Parameters<typeof workPlanActivity.updateActivity>[1] = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.dueDate !== undefined) patch.dueDate = body.dueDate || null;
    if (body.status !== undefined) {
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
    if (body.assignedTo !== undefined) patch.assignedToId = body.assignedTo || null;

    const updated = await workPlanActivity.updateActivity(id, patch);

    if (body.status !== undefined && body.status !== existing.status && caseId) {
      const oldLabel = ACTIVITY_STATUS_LABELS[existing.status as ActivityStatus] || existing.status;
      const newLabel = ACTIVITY_STATUS_LABELS[body.status as ActivityStatus] || body.status;
      logCaseEvent({
        caseId,
        eventType: 'other',
        description: `Actividad "${existing.title}": ${oldLabel} → ${newLabel}`,
        userId, userName,
      });
    }

    triggerEvent('activity:updated', { id });

    return NextResponse.json({ success: true, data: updated });
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

    const stop = guardRole(request, canManageWorkPlanActions);
    if (stop) return stop;

    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');

    const existing = await workPlanActivity.getActivityById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Actividad no encontrada' }, { status: 404 });
    }
    const caseId = await workPlanActivity.getActivityCaseId(id);

    await workPlanActivity.deleteActivity(id);

    if (caseId) {
      logCaseEvent({
        caseId,
        eventType: 'other',
        description: `Actividad eliminada: "${existing.title}"`,
        userId, userName,
      });
    }

    triggerEvent('activity:deleted', { id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Error eliminando actividad' }, { status: 500 });
  }
}
