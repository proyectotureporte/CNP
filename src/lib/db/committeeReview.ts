import { query, queryOne, buildInsert, newId, nestedObj } from './pool';
import type { CommitteeReview, CommitteeViability } from '@/lib/types';

// Decisión de comité por caso (RF-07): viabilidad, alcance, honorarios,
// entregables y tiempo. Una fila por caso (case_id UNIQUE) — upsert.

const decidedByObj = nestedObj('u', { _id: 'u.id', displayName: 'u.display_name' });

const SELECT = `
  r.id AS "_id", r.created_at AS "_createdAt", r.viability,
  r.viability_reason AS "viabilityReason", r.scope, r.fees,
  r.deliverables_description AS "deliverablesDescription",
  r.estimated_days AS "estimatedDays", r.notes, r.decided_at AS "decidedAt",
  ${decidedByObj} AS "decidedBy"
`;

const FROM = `FROM committee_review r LEFT JOIN crm_user u ON u.id = r.decided_by_id`;

export async function getCommitteeReviewByCase(caseId: string): Promise<CommitteeReview | null> {
  return queryOne<CommitteeReview>(`SELECT ${SELECT} ${FROM} WHERE r.case_id = $1`, [caseId]);
}

export interface CommitteeReviewInput {
  caseId: string;
  viability?: CommitteeViability | null;
  viabilityReason?: string | null;
  scope?: string | null;
  fees?: number | null;
  deliverablesDescription?: string | null;
  estimatedDays?: number | null;
  notes?: string | null;
  decidedById?: string | null;
}

/** Inserta o actualiza la decisión de comité del caso (una por caso). */
export async function upsertCommitteeReview(input: CommitteeReviewInput): Promise<CommitteeReview | null> {
  const decidedById = input.decidedById && input.decidedById !== 'admin' ? input.decidedById : null;
  const { text, values } = buildInsert('committee_review', {
    id: newId(),
    case_id: input.caseId,
    viability: input.viability ?? null,
    viability_reason: input.viabilityReason ?? null,
    scope: input.scope ?? null,
    fees: input.fees ?? null,
    deliverables_description: input.deliverablesDescription ?? null,
    estimated_days: input.estimatedDays ?? null,
    notes: input.notes ?? null,
    decided_by_id: decidedById,
    decided_at: input.viability ? new Date().toISOString() : null,
  });
  await query(
    `${text}
     ON CONFLICT (case_id) DO UPDATE SET
       viability = EXCLUDED.viability,
       viability_reason = EXCLUDED.viability_reason,
       scope = EXCLUDED.scope,
       fees = EXCLUDED.fees,
       deliverables_description = EXCLUDED.deliverables_description,
       estimated_days = EXCLUDED.estimated_days,
       notes = EXCLUDED.notes,
       decided_by_id = EXCLUDED.decided_by_id,
       decided_at = EXCLUDED.decided_at`,
    values,
  );
  return getCommitteeReviewByCase(input.caseId);
}
