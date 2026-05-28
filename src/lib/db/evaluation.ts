import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type { Evaluation } from '@/lib/types';

const expertObj = nestedObj('ex', { _id: 'ex.id', displayName: 'ex.display_name' });
const evaluatedByObj = nestedObj('eb', { _id: 'eb.id', displayName: 'eb.display_name' });
const caseObj = nestedObj('c', { _id: 'c.id', caseCode: 'c.case_code', title: 'c.title' });

const SELECT = `
  e.id AS "_id", e.created_at AS "_createdAt",
  e.punctuality_score AS "punctualityScore", e.quality_score AS "qualityScore",
  e.service_score AS "serviceScore", e.final_score AS "finalScore",
  e.client_feedback AS "clientFeedback", e.technical_feedback AS "technicalFeedback",
  ${expertObj} AS "expert",
  ${evaluatedByObj} AS "evaluatedBy"
`;

const JOINS = `LEFT JOIN crm_user ex ON ex.id = e.expert_id LEFT JOIN crm_user eb ON eb.id = e.evaluated_by_id`;

export async function getCaseEvaluation(caseId: string): Promise<Evaluation | null> {
  return queryOne<Evaluation>(
    `SELECT ${SELECT} FROM evaluation e ${JOINS} WHERE e.case_id = $1 LIMIT 1`,
    [caseId],
  );
}

export async function listExpertEvaluations(expertId: string): Promise<Evaluation[]> {
  return query<Evaluation>(
    `SELECT ${SELECT}, ${caseObj} AS "case"
     FROM evaluation e ${JOINS} LEFT JOIN cases c ON c.id = e.case_id
     WHERE e.expert_id = $1 ORDER BY e.created_at DESC`,
    [expertId],
  );
}

export async function getExpertAverageRating(
  expertId: string,
): Promise<{ avgRating: number | null; totalEvaluations: number }> {
  const row = await queryOne<{ avgRating: number | null; totalEvaluations: number }>(
    `SELECT avg(final_score)::float8 AS "avgRating", count(*)::int AS "totalEvaluations"
     FROM evaluation WHERE expert_id = $1`,
    [expertId],
  );
  return row ?? { avgRating: null, totalEvaluations: 0 };
}

export async function listAllEvaluations(limit = 20, offset = 0): Promise<Evaluation[]> {
  return query<Evaluation>(
    `SELECT ${SELECT}, ${caseObj} AS "case"
     FROM evaluation e ${JOINS} LEFT JOIN cases c ON c.id = e.case_id
     ORDER BY e.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
}

export async function countAllEvaluations(): Promise<number> {
  const row = await queryOne<{ count: number }>('SELECT count(*)::int AS count FROM evaluation');
  return row?.count ?? 0;
}

export interface EvaluationInput {
  caseId: string;
  expertId?: string | null;
  punctualityScore?: number | null;
  qualityScore?: number | null;
  serviceScore?: number | null;
  finalScore?: number | null;
  clientFeedback?: string | null;
  technicalFeedback?: string | null;
  evaluatedById?: string | null;
}

function toColumns(input: Partial<EvaluationInput>): Record<string, unknown> {
  return pruneUndefined({
    case_id: input.caseId,
    expert_id: input.expertId,
    punctuality_score: input.punctualityScore,
    quality_score: input.qualityScore,
    service_score: input.serviceScore,
    final_score: input.finalScore,
    client_feedback: input.clientFeedback,
    technical_feedback: input.technicalFeedback,
    evaluated_by_id: input.evaluatedById,
  });
}

export async function createEvaluation(input: EvaluationInput): Promise<Evaluation | null> {
  const id = newId();
  const { text, values } = buildInsert('evaluation', { id, ...toColumns(input) });
  await query(text, values);
  return getCaseEvaluation(input.caseId);
}

export async function updateEvaluation(id: string, patch: Partial<EvaluationInput>): Promise<void> {
  const upd = buildUpdate('evaluation', id, toColumns(patch));
  if (upd) await query(upd.text, upd.values);
}

export async function deleteEvaluation(id: string): Promise<void> {
  await query('DELETE FROM evaluation WHERE id = $1', [id]);
}
