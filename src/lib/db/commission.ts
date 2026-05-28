import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type { Commission, CommissionStatus } from '@/lib/types';

const expertObj = nestedObj('ex', { _id: 'ex.id', displayName: 'ex.display_name' });
const caseObj = nestedObj('c', { _id: 'c.id', caseCode: 'c.case_code', title: 'c.title' });

const FIELDS = `
  cm.id AS "_id", cm.created_at AS "_createdAt", cm.base_amount AS "baseAmount",
  cm.bonus_percentage AS "bonusPercentage", cm.penalty_percentage AS "penaltyPercentage",
  cm.final_amount AS "finalAmount", cm.status, cm.payment_date AS "paymentDate",
  cm.payment_reference AS "paymentReference"
`;

export async function listExpertCommissions(expertId: string): Promise<Commission[]> {
  return query<Commission>(
    `SELECT ${FIELDS}, ${caseObj} AS "caseRef"
     FROM commission cm LEFT JOIN cases c ON c.id = cm.case_id
     WHERE cm.expert_id = $1 ORDER BY cm.created_at DESC`,
    [expertId],
  );
}

export async function listAllCommissions(status = '', limit = 20, offset = 0): Promise<Commission[]> {
  return query<Commission>(
    `SELECT ${FIELDS}, ${expertObj} AS "expert", ${caseObj} AS "caseRef"
     FROM commission cm
     LEFT JOIN crm_user ex ON ex.id = cm.expert_id
     LEFT JOIN cases c ON c.id = cm.case_id
     WHERE ($1 = '' OR cm.status = $1::commission_status)
     ORDER BY cm.created_at DESC LIMIT $2 OFFSET $3`,
    [status, limit, offset],
  );
}

export async function countAllCommissions(status = ''): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT count(*)::int AS count FROM commission WHERE ($1 = '' OR status = $1::commission_status)`,
    [status],
  );
  return row?.count ?? 0;
}

export async function getCommissionById(id: string): Promise<Commission | null> {
  return queryOne<Commission>(
    `SELECT ${FIELDS}, ${expertObj} AS "expert", ${caseObj} AS "caseRef"
     FROM commission cm
     LEFT JOIN crm_user ex ON ex.id = cm.expert_id
     LEFT JOIN cases c ON c.id = cm.case_id
     WHERE cm.id = $1`,
    [id],
  );
}

export interface CommissionInput {
  expertId?: string | null;
  caseId?: string | null;
  baseAmount?: number | null;
  bonusPercentage?: number;
  penaltyPercentage?: number;
  finalAmount?: number | null;
  status?: CommissionStatus;
  paymentDate?: string | null;
  paymentReference?: string | null;
}

function toColumns(input: Partial<CommissionInput>): Record<string, unknown> {
  return pruneUndefined({
    expert_id: input.expertId,
    case_id: input.caseId,
    base_amount: input.baseAmount,
    bonus_percentage: input.bonusPercentage,
    penalty_percentage: input.penaltyPercentage,
    final_amount: input.finalAmount,
    status: input.status,
    payment_date: input.paymentDate,
    payment_reference: input.paymentReference,
  });
}

export async function createCommission(input: CommissionInput): Promise<Commission | null> {
  const id = newId();
  const { text, values } = buildInsert('commission', { id, ...toColumns(input) });
  await query(text, values);
  return getCommissionById(id);
}

export async function updateCommission(id: string, patch: Partial<CommissionInput>): Promise<Commission | null> {
  const upd = buildUpdate('commission', id, toColumns(patch));
  if (upd) await query(upd.text, upd.values);
  return getCommissionById(id);
}

export async function deleteCommission(id: string): Promise<void> {
  await query('DELETE FROM commission WHERE id = $1', [id]);
}
