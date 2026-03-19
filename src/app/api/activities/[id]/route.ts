import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { ACTIVITY_STATUS_LABELS, type ActivityStatus } from '@/lib/types';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/pusher/server';

const getActivityQuery = `*[_type == "workPlanActivity" && _id == $id][0]{
  _id, title, description, dueDate, status, startedAt, completedAt,
  "assignedTo": assignedTo->{ _id, displayName, role },
  "caseId": case._ref
}`;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const body = await request.json();

    const existing = await client.fetch(getActivityQuery, { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Actividad no encontrada' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate || null;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'en_progreso' && !existing.startedAt) {
        updateData.startedAt = new Date().toISOString();
      }
      if (body.status === 'completada') {
        updateData.completedAt = new Date().toISOString();
        if (!existing.startedAt) {
          updateData.startedAt = new Date().toISOString();
        }
      } else {
        updateData.completedAt = null;
      }
      if (body.status === 'pendiente') {
        updateData.startedAt = null;
        updateData.completedAt = null;
      }
    }
    if (body.assignedTo !== undefined) {
      updateData.assignedTo = body.assignedTo
        ? { _type: 'reference', _ref: body.assignedTo }
        : null;
    }

    const updated = await writeClient.patch(id).set(updateData).commit();

    // Log event for status changes
    if (body.status !== undefined && body.status !== existing.status && existing.caseId) {
      const oldLabel = ACTIVITY_STATUS_LABELS[existing.status as ActivityStatus] || existing.status;
      const newLabel = ACTIVITY_STATUS_LABELS[body.status as ActivityStatus] || body.status;
      logCaseEvent({
        caseId: existing.caseId,
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
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');

    const existing = await client.fetch(getActivityQuery, { id });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Actividad no encontrada' }, { status: 404 });
    }

    await writeClient.delete(id);

    if (existing.caseId) {
      logCaseEvent({
        caseId: existing.caseId,
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
