import {
  query,
  queryOne,
  buildInsert,
  buildUpdate,
  newId,
  pruneUndefined,
  nestedObj,
  withTransaction,
} from './pool';
import type {
  CaseMessageAudience,
  Deliverable,
  DeliverablePhase,
  DeliverableStatus,
  UserRole,
} from '@/lib/types';

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
  const rows = await query<Deliverable>(
    `SELECT ${SELECT} FROM deliverable d ${JOINS}
     WHERE d.case_id = $1 ORDER BY d.phase_number ASC, d.version DESC`,
    [caseId],
  );
  return Promise.all(rows.map(withAttachments));
}

export async function getDeliverableById(id: string): Promise<Deliverable | null> {
  const row = await queryOne<Deliverable>(
    `SELECT ${SELECT}, ${caseObj} AS "case"
     FROM deliverable d ${JOINS} LEFT JOIN cases c ON c.id = d.case_id
     WHERE d.id = $1`,
    [id],
  );
  return row ? withAttachments(row) : null;
}

async function withAttachments(item: Deliverable): Promise<Deliverable> {
  const attachments = await query<{
    _id: string; fileName: string; mimeType?: string; fileSize?: number;
  }>(
    `SELECT id AS "_id", file_name AS "fileName", mime_type AS "mimeType",
       file_size AS "fileSize" FROM deliverable_attachment
     WHERE deliverable_id = $1 ORDER BY created_at ASC`,
    [item._id],
  );
  return { ...item, attachments };
}

export async function getDeliverableAccessRow(id: string): Promise<{
  caseId: string;
  status: DeliverableStatus;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
} | null> {
  return queryOne(
    `SELECT case_id AS "caseId", status, file_url AS "fileUrl",
       file_name AS "fileName", mime_type AS "mimeType"
     FROM deliverable WHERE id = $1`,
    [id],
  );
}

export async function getDeliverableAttachmentAccessRow(id: string): Promise<{
  caseId: string;
  deliverableStatus: DeliverableStatus;
  fileUrl: string;
  fileName: string;
  mimeType: string | null;
} | null> {
  return queryOne(
    `SELECT d.case_id AS "caseId", d.status AS "deliverableStatus",
       a.file_url AS "fileUrl", a.file_name AS "fileName", a.mime_type AS "mimeType"
     FROM deliverable_attachment a
     JOIN deliverable d ON d.id = a.deliverable_id
     WHERE a.id = $1`,
    [id],
  );
}

export async function addDeliverableAttachment(input: {
  deliverableId: string;
  fileUrl: string;
  fileAssetId?: string | null;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
}): Promise<string> {
  const id = newId();
  const { text, values } = buildInsert('deliverable_attachment', {
    id,
    deliverable_id: input.deliverableId,
    file_url: input.fileUrl,
    file_asset_id: input.fileAssetId ?? null,
    file_name: input.fileName,
    mime_type: input.mimeType ?? null,
    file_size: input.fileSize ?? null,
  });
  await query(text, values);
  return id;
}

export async function countCaseDeliverables(caseId: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    'SELECT count(*)::int AS count FROM deliverable WHERE case_id = $1',
    [caseId],
  );
  return row?.count ?? 0;
}

export async function getNextDeliverableVersion(
  caseId: string,
  phase: DeliverablePhase,
): Promise<number> {
  const row = await queryOne<{ next: number }>(
    `SELECT COALESCE(max(version), 0)::int + 1 AS next
     FROM deliverable WHERE case_id = $1 AND phase = $2::deliverable_phase`,
    [caseId, phase],
  );
  return row?.next ?? 1;
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

export async function listExpertDeliverables(
  expertId: string,
  status = '',
  phase = '',
  limit = 20,
  offset = 0,
): Promise<Deliverable[]> {
  return query<Deliverable>(
    `SELECT ${SELECT}, ${caseObj} AS "case"
     FROM deliverable d ${JOINS}
     JOIN cases c ON c.id = d.case_id
     WHERE (c.assigned_expert_id = $1 OR c.assigned_financiero_id = $1)
       AND ($2 = '' OR d.status = $2::deliverable_status)
       AND ($3 = '' OR d.phase = $3::deliverable_phase)
     ORDER BY d.created_at DESC LIMIT $4 OFFSET $5`,
    [expertId, status, phase, limit, offset],
  );
}

export async function countExpertDeliverables(expertId: string, status = '', phase = ''): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT count(*)::int AS count FROM deliverable d
     JOIN cases c ON c.id = d.case_id
     WHERE (c.assigned_expert_id = $1 OR c.assigned_financiero_id = $1)
       AND ($2 = '' OR d.status = $2::deliverable_status)
       AND ($3 = '' OR d.phase = $3::deliverable_phase)`,
    [expertId, status, phase],
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

/**
 * Publica el resultado de la revisión y su mensaje de caso como una sola
 * operación. De este modo un dictamen no puede quedar aprobado/rechazado sin
 * la notificación persistente que explica el resultado en el hilo correcto.
 */
export async function reviewDeliverableWithMessage(input: {
  id: string;
  caseId: string;
  status: Extract<DeliverableStatus, 'aprobado' | 'rechazado'>;
  rejectionReason?: string | null;
  reviewerId: string;
  senderName: string;
  senderRole: UserRole;
  audience: CaseMessageAudience;
  message: string;
}): Promise<Deliverable | null> {
  const messageId = newId();
  const reviewerId = input.reviewerId !== 'admin' ? input.reviewerId : null;

  await withTransaction(async (client) => {
    const updated = await client.query<{ id: string }>(
      `UPDATE deliverable
       SET status = $1::deliverable_status,
           rejection_reason = $2,
           reviewed_by_id = $3,
           approved_by_id = $4,
           updated_at = now()
       WHERE id = $5 AND case_id = $6
         AND status IN ('enviado', 'en_revision')
       RETURNING id`,
      [
        input.status,
        input.status === 'rechazado' ? input.rejectionReason ?? null : null,
        reviewerId,
        input.status === 'aprobado' ? reviewerId : null,
        input.id,
        input.caseId,
      ],
    );
    if (updated.rowCount !== 1) {
      throw new Error('DELIVERABLE_STATE_CONFLICT');
    }

    await client.query(
      `INSERT INTO case_message (
         id, case_id, audience, sender_id, sender_name, sender_role, body
       ) VALUES ($1, $2, $3::case_message_audience, $4, $5, $6::user_role, $7)`,
      [
        messageId,
        input.caseId,
        input.audience,
        reviewerId,
        input.senderName,
        input.senderRole,
        input.message,
      ],
    );
  });

  return getDeliverableById(input.id);
}

export async function deleteDeliverable(id: string): Promise<void> {
  await query('DELETE FROM deliverable WHERE id = $1', [id]);
}
