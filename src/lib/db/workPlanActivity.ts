import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type { WorkPlanActivity, ActivityStatus } from '@/lib/types';

const assignedToObj = nestedObj('at', { _id: 'at.id', displayName: 'at.display_name', role: 'at.role' });
const createdByObj = nestedObj('cb', { _id: 'cb.id', displayName: 'cb.display_name' });

const SELECT = `
  a.id AS "_id", a.created_at AS "_createdAt", a.title, a.description,
  a.due_date AS "dueDate", a.status, a.started_at AS "startedAt", a.completed_at AS "completedAt",
  a.file_url AS "fileUrl", a.file_name AS "fileName",
  ${assignedToObj} AS "assignedTo",
  ${createdByObj} AS "createdBy"
`;

const JOINS = `LEFT JOIN crm_user at ON at.id = a.assigned_to_id LEFT JOIN crm_user cb ON cb.id = a.created_by_id`;

export async function listWorkPlanActivities(caseId: string): Promise<WorkPlanActivity[]> {
  return query<WorkPlanActivity>(
    `SELECT ${SELECT} FROM work_plan_activity a ${JOINS}
     WHERE a.case_id = $1 ORDER BY a.created_at ASC`,
    [caseId],
  );
}

export async function listByWorkPlan(workPlanId: string): Promise<WorkPlanActivity[]> {
  return query<WorkPlanActivity>(
    `SELECT ${SELECT} FROM work_plan_activity a ${JOINS}
     WHERE a.work_plan_id = $1 ORDER BY a.created_at ASC`,
    [workPlanId],
  );
}

/** case_id de una actividad (para registrar eventos). */
export async function getActivityCaseId(id: string): Promise<string | null> {
  const row = await queryOne<{ case_id: string | null }>(
    'SELECT case_id FROM work_plan_activity WHERE id = $1',
    [id],
  );
  return row?.case_id ?? null;
}

export async function getActivityById(id: string): Promise<WorkPlanActivity | null> {
  return queryOne<WorkPlanActivity>(
    `SELECT ${SELECT} FROM work_plan_activity a ${JOINS} WHERE a.id = $1`,
    [id],
  );
}

export async function countActivitiesByStatus(
  caseId: string,
): Promise<{ total: number; completadas: number; en_progreso: number; pendientes: number }> {
  const row = await queryOne<{ total: number; completadas: number; en_progreso: number; pendientes: number }>(
    `SELECT
       count(*)::int AS total,
       count(*) FILTER (WHERE status = 'completada')::int AS completadas,
       count(*) FILTER (WHERE status = 'en_progreso')::int AS en_progreso,
       count(*) FILTER (WHERE status = 'pendiente')::int AS pendientes
     FROM work_plan_activity WHERE case_id = $1`,
    [caseId],
  );
  return row ?? { total: 0, completadas: 0, en_progreso: 0, pendientes: 0 };
}

export interface WorkPlanActivityInput {
  workPlanId?: string | null;
  caseId?: string | null;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status?: ActivityStatus;
  assignedToId?: string | null;
  fileUrl?: string | null;
  fileAssetId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdById?: string | null;
}

function toColumns(input: Partial<WorkPlanActivityInput>): Record<string, unknown> {
  return pruneUndefined({
    work_plan_id: input.workPlanId,
    case_id: input.caseId,
    title: input.title,
    description: input.description,
    due_date: input.dueDate,
    status: input.status,
    assigned_to_id: input.assignedToId,
    file_url: input.fileUrl,
    file_asset_id: input.fileAssetId,
    file_name: input.fileName,
    mime_type: input.mimeType,
    file_size: input.fileSize,
    started_at: input.startedAt,
    completed_at: input.completedAt,
    created_by_id: input.createdById,
  });
}

export async function createActivity(input: WorkPlanActivityInput): Promise<WorkPlanActivity | null> {
  const id = newId();
  const { text, values } = buildInsert('work_plan_activity', { id, ...toColumns(input) });
  await query(text, values);
  return getActivityById(id);
}

export async function updateActivity(
  id: string,
  patch: Partial<WorkPlanActivityInput>,
): Promise<WorkPlanActivity | null> {
  const upd = buildUpdate('work_plan_activity', id, toColumns(patch));
  if (upd) await query(upd.text, upd.values);
  return getActivityById(id);
}

export async function deleteActivity(id: string): Promise<void> {
  await query('DELETE FROM work_plan_activity WHERE id = $1', [id]);
}
