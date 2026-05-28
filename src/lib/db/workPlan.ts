import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type { WorkPlan, WorkPlanStatus } from '@/lib/types';

const assignedExpertObj = nestedObj('ae', { _id: 'ae.id', displayName: 'ae.display_name' });
const reviewedByObj = nestedObj('rb', { _id: 'rb.id', displayName: 'rb.display_name' });
const committeeObj = nestedObj('ca', { _id: 'ca.id', displayName: 'ca.display_name' });
const createdByObj = nestedObj('cb', { _id: 'cb.id', displayName: 'cb.display_name' });
const caseObj = nestedObj('c', { _id: 'c.id', caseCode: 'c.case_code', title: 'c.title' });

const SELECT = `
  wp.id AS "_id", wp.created_at AS "_createdAt", wp.methodology, wp.objectives,
  wp.start_date AS "startDate", wp.end_date AS "endDate", wp.estimated_days AS "estimatedDays",
  wp.deliverables_description AS "deliverablesDescription", wp.status,
  wp.submitted_at AS "submittedAt", wp.rejection_comments AS "rejectionComments",
  ${assignedExpertObj} AS "assignedExpert",
  ${reviewedByObj} AS "reviewedBy",
  ${committeeObj} AS "committeeApprovedBy",
  ${createdByObj} AS "createdBy"
`;

const JOINS = `
  LEFT JOIN crm_user ae ON ae.id = wp.assigned_expert_id
  LEFT JOIN crm_user rb ON rb.id = wp.reviewed_by_id
  LEFT JOIN crm_user ca ON ca.id = wp.committee_approved_by_id
  LEFT JOIN crm_user cb ON cb.id = wp.created_by_id
`;

export async function getCaseWorkPlan(caseId: string): Promise<WorkPlan | null> {
  return queryOne<WorkPlan>(
    `SELECT ${SELECT} FROM work_plan wp ${JOINS}
     WHERE wp.case_id = $1 ORDER BY wp.created_at DESC LIMIT 1`,
    [caseId],
  );
}

export async function getWorkPlanById(id: string): Promise<WorkPlan | null> {
  return queryOne<WorkPlan>(
    `SELECT ${SELECT}, ${caseObj} AS "case"
     FROM work_plan wp ${JOINS} LEFT JOIN cases c ON c.id = wp.case_id
     WHERE wp.id = $1`,
    [id],
  );
}

export async function listAllWorkPlans(status = '', limit = 20, offset = 0): Promise<WorkPlan[]> {
  return query<WorkPlan>(
    `SELECT ${SELECT}, ${caseObj} AS "case",
       json_build_object(
         'total', (SELECT count(*)::int FROM work_plan_activity a WHERE a.work_plan_id = wp.id),
         'completadas', (SELECT count(*)::int FROM work_plan_activity a WHERE a.work_plan_id = wp.id AND a.status = 'completada')
       ) AS "activityCounts"
     FROM work_plan wp ${JOINS} LEFT JOIN cases c ON c.id = wp.case_id
     WHERE ($1 = '' OR wp.status = $1::work_plan_status)
     ORDER BY wp.created_at DESC LIMIT $2 OFFSET $3`,
    [status, limit, offset],
  );
}

export async function countAllWorkPlans(status = ''): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT count(*)::int AS count FROM work_plan WHERE ($1 = '' OR status = $1::work_plan_status)`,
    [status],
  );
  return row?.count ?? 0;
}

export interface WorkPlanInput {
  caseId: string;
  assignedExpertId?: string | null;
  methodology?: string | null;
  objectives?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  estimatedDays?: number | null;
  deliverablesDescription?: string | null;
  status?: WorkPlanStatus;
  submittedAt?: string | null;
  reviewedById?: string | null;
  committeeApprovedById?: string | null;
  rejectionComments?: string | null;
  createdById?: string | null;
}

function toColumns(input: Partial<WorkPlanInput>): Record<string, unknown> {
  return pruneUndefined({
    case_id: input.caseId,
    assigned_expert_id: input.assignedExpertId,
    methodology: input.methodology,
    objectives: input.objectives,
    start_date: input.startDate,
    end_date: input.endDate,
    estimated_days: input.estimatedDays,
    deliverables_description: input.deliverablesDescription,
    status: input.status,
    submitted_at: input.submittedAt,
    reviewed_by_id: input.reviewedById,
    committee_approved_by_id: input.committeeApprovedById,
    rejection_comments: input.rejectionComments,
    created_by_id: input.createdById,
  });
}

export async function createWorkPlan(input: WorkPlanInput): Promise<WorkPlan | null> {
  const id = newId();
  const { text, values } = buildInsert('work_plan', { id, ...toColumns(input) });
  await query(text, values);
  return getWorkPlanById(id);
}

export async function updateWorkPlan(id: string, patch: Partial<WorkPlanInput>): Promise<WorkPlan | null> {
  const upd = buildUpdate('work_plan', id, toColumns(patch));
  if (upd) await query(upd.text, upd.values);
  return getWorkPlanById(id);
}

export async function deleteWorkPlan(id: string): Promise<void> {
  await query('DELETE FROM work_plan WHERE id = $1', [id]);
}
