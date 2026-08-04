import { buildInsert, newId, query, queryOne } from './pool';
import type { CaseMessage, CaseMessageAudience, UserRole } from '@/lib/types';

const SELECT = `
  id AS "_id", created_at AS "_createdAt", audience,
  sender_id AS "senderId", sender_name AS "senderName", sender_role AS "senderRole",
  body, attachment_name AS "attachmentName",
  attachment_mime_type AS "attachmentMimeType", attachment_size AS "attachmentSize"
`;

export async function listCaseMessages(
  caseId: string,
  audience: CaseMessageAudience,
): Promise<CaseMessage[]> {
  return query<CaseMessage>(
    `SELECT ${SELECT} FROM case_message
     WHERE case_id = $1 AND audience = $2::case_message_audience
     ORDER BY created_at ASC`,
    [caseId, audience],
  );
}

export async function createCaseMessage(input: {
  caseId: string;
  audience: CaseMessageAudience;
  senderId?: string | null;
  senderName: string;
  senderRole: UserRole;
  body: string;
  attachmentUrl?: string | null;
  attachmentAssetId?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
}): Promise<CaseMessage | null> {
  const id = newId();
  const { text, values } = buildInsert('case_message', {
    id,
    case_id: input.caseId,
    audience: input.audience,
    sender_id: input.senderId && input.senderId !== 'admin' ? input.senderId : null,
    sender_name: input.senderName,
    sender_role: input.senderRole,
    body: input.body,
    attachment_url: input.attachmentUrl ?? null,
    attachment_asset_id: input.attachmentAssetId ?? null,
    attachment_name: input.attachmentName ?? null,
    attachment_mime_type: input.attachmentMimeType ?? null,
    attachment_size: input.attachmentSize ?? null,
  });
  await query(text, values);
  return queryOne<CaseMessage>(`SELECT ${SELECT} FROM case_message WHERE id = $1`, [id]);
}

export async function getMessageAttachment(id: string): Promise<{
  caseId: string;
  audience: CaseMessageAudience;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
} | null> {
  return queryOne(
    `SELECT case_id AS "caseId", audience, attachment_url AS "fileUrl",
       attachment_name AS "fileName", attachment_mime_type AS "mimeType"
     FROM case_message WHERE id = $1`,
    [id],
  );
}

export interface MessageParticipant {
  userId: string;
  email: string | null;
  displayName: string | null;
}

/** Destinatarios de la audiencia contraria al emisor, sin mezclar hilos. */
export async function listMessageRecipients(
  caseId: string,
  audience: CaseMessageAudience,
  senderRole: UserRole,
): Promise<MessageParticipant[]> {
  if (senderRole === 'perito' || senderRole === 'cliente') {
    return query<MessageParticipant>(
      `SELECT u.id AS "userId", u.email, u.display_name AS "displayName"
       FROM cases c JOIN crm_user u ON u.id = c.assigned_juridico_id
       WHERE c.id = $1 AND u.active = TRUE`,
      [caseId],
    );
  }

  if (audience === 'juridico_perito') {
    return query<MessageParticipant>(
      `SELECT DISTINCT u.id AS "userId", u.email, u.display_name AS "displayName"
       FROM cases c
       JOIN crm_user u ON u.id IN (c.assigned_expert_id, c.assigned_financiero_id)
       WHERE c.id = $1 AND u.role = 'perito' AND u.active = TRUE`,
      [caseId],
    );
  }

  return query<MessageParticipant>(
    `SELECT DISTINCT u.id AS "userId", u.email, u.display_name AS "displayName"
     FROM cases c
     JOIN crm_user u ON u.client_id = c.client_id
     WHERE c.id = $1 AND u.role = 'cliente' AND u.active = TRUE`,
    [caseId],
  );
}
