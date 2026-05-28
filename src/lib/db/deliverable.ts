import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type { Deliverable, DeliverablePhase, DeliverableStatus } from '@/lib/types';

const submittedByObj = nestedObj('sb', { _id: 'sb.id', displayName: 'sb.display_name' });
const reviewedByObj = nestedObj('rb', { _id: 'rb.id', displayName: 'rb.display_name' });
const approvedByObj = nestedObj('ab', { _id: 'ab.id', displayName: 'ab.display_name' });
const caseObj = nestedObj('c', { _id: 'c.id', caseCode: 'c.case_code', title: 'c.title' });

const SELECT = `
  d.id AS "_id", d.created_at AS "_createdAt", d.phase, d.phase_number AS "phaseNumber",
  d.file_name AS "fileName", d.status, d.comments, d.rejection_reason AS "rejectionReason",
  d.version, d.file_url AS "fileUrl",
  ${submittedByObj} AS "submittedBy",
  ${reviewedByObj} AS "reviewedBy",
  ${approvedByObj} AS "approvedBy"
`;

const JOINS = `
  LEFT JOIN crm_user sb ON sb.id = d.submitted_by_id
  LEFT JOIN crm_user rb ON rb.id = d.reviewed_by_id
  LEFT JOIN crm_user ab ON ab.id = d.approved_by_id
`;

export async function listCaseDeliverables(caseId: string): Promise<Deliverable[]> {
  return query<Deliverable>(
    `SELECT ${SELECT} FROM deliverable d ${JOINS}
     WHERE d.case_id = $1 ORDER BY d.phase_number ASC, d.version DESC`,
    [caseId],
  );
}

export async function getDeliverableById(id: string): Promise<Deliverable | null> {
  return queryOne<Deliverable>(
    `SELECT ${SELECT}, ${caseObj} AS "case"
     FROM deliverable d ${JOINS} LEFT JOIN cases c ON c.id = d.case_id
     WHERE d.id = $1`,
    [id],
  );
}

export async function countCaseDeliverables(caseId: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    'SELECT count(*)::int AS count FROM deliverable WHERE case_id = $1',
    [caseId],
  );
  return row?.count ?? 0;
}

export async function listAllDeliverables(status = '', phase = '', limit = 20, offset = 0): Promise<Deliverable[]> {
  return query<Deliverable>(
    `SELECT ${SELECT}, ${caseObj} AS "case"
     FROM deliverable d ${JOINS} LEFT JOIN cases c ON c.id = d.case_id
     WHERE ($1 = '' OR d.status = $1::deliverable_status)
       AND ($2 = '' OR d.phase = $2::deliverable_phase)
     ORDER BY d.created_at DESC LIMIT $3 OFFSET $4`,
    [status, phase, limit, offset],
  );
}

export async function countAllDeliverables(status = '', phase = ''): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT count(*)::int AS count FROM deliverable
     WHERE ($1 = '' OR status = $1::deliverable_status) AND ($2 = '' OR phase = $2::deliverable_phase)`,
    [status, phase],
  );
  return row?.count ?? 0;
}

export async function getCaseDeliverableProgress(
  caseId: string,
): Promise<{ marco_conceptual: boolean; desarrollo_tecnico: boolean; dictamen_final: boolean }> {
  const row = await queryOne<{ marco_conceptual: boolean; desarrollo_tecnico: boolean; dictamen_final: boolean }>(
    `SELECT
       count(*) FILTER (WHERE phase = 'marco_conceptual' AND status = 'aprobado') > 0 AS marco_conceptual,
       count(*) FILTER (WHERE phase = 'desarrollo_tecnico' AND status = 'aprobado') > 0 AS desarrollo_tecnico,
       count(*) FILTER (WHERE phase = 'dictamen_final' AND status = 'aprobado') > 0 AS dictamen_final
     FROM deliverable WHERE case_id = $1`,
    [caseId],
  );
  return row ?? { marco_conceptual: false, desarrollo_tecnico: false, dictamen_final: false };
}

export interface DeliverableInput {
  caseId: string;
  phase?: DeliverablePhase | null;
  phaseNumber?: number | null;
  fileUrl?: string | null;
  fileAssetId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  submittedById?: string | null;
  status?: DeliverableStatus;
  reviewedById?: string | null;
  approvedById?: string | null;
  comments?: string | null;
  rejectionReason?: string | null;
  version?: number;
}

function toColumns(input: Partial<DeliverableInput>): Record<string, unknown> {
  return pruneUndefined({
    case_id: input.caseId,
    phase: input.phase,
    phase_number: input.phaseNumber,
    file_url: input.fileUrl,
    file_asset_id: input.fileAssetId,
    file_name: input.fileName,
    mime_type: input.mimeType,
    file_size: input.fileSize,
    submitted_by_id: input.submittedById,
    status: input.status,
    reviewed_by_id: input.reviewedById,
    approved_by_id: input.approvedById,
    comments: input.comments,
    rejection_reason: input.rejectionReason,
    version: input.version,
  });
}

export async function createDeliverable(input: DeliverableInput): Promise<Deliverable | null> {
  const id = newId();
  const { text, values } = buildInsert('deliverable', { id, ...toColumns(input) });
  await query(text, values);
  return getDeliverableById(id);
}

export async function updateDeliverable(id: string, patch: Partial<DeliverableInput>): Promise<Deliverable | null> {
  const upd = buildUpdate('deliverable', id, toColumns(patch));
  if (upd) await query(upd.text, upd.values);
  return getDeliverableById(id);
}

export async function deleteDeliverable(id: string): Promise<void> {
  await query('DELETE FROM deliverable WHERE id = $1', [id]);
}
