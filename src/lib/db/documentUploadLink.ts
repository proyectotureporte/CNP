import { query, queryOne, withTransaction } from './pool';
import type { DocumentUploadLinkStatus, PublicDocumentUploadContext } from '@/lib/types';

interface ValidUploadLinkRow {
  id: string;
  caseId: string;
  clientId: string;
  clientName: string;
  caseCode: string;
  caseTitle: string;
  brand: 'CNP' | 'Peritus';
  expiresAt: string;
  assignedJuridicoId: string | null;
  commercialId: string | null;
}

export async function getLinkStatus(caseId: string): Promise<DocumentUploadLinkStatus | null> {
  return queryOne<DocumentUploadLinkStatus>(
    `SELECT id AS "_id", created_at AS "createdAt", expires_at AS "expiresAt",
       revoked_at AS "revokedAt", last_used_at AS "lastUsedAt",
       upload_count AS "uploadCount",
       (revoked_at IS NULL AND expires_at > now()) AS active
     FROM client_document_upload_link
     WHERE case_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [caseId],
  );
}

export async function createLink(input: {
  id: string;
  caseId: string;
  clientId: string;
  tokenHash: string;
  createdById?: string | null;
  expiresAt: Date;
}): Promise<DocumentUploadLinkStatus> {
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE client_document_upload_link
       SET revoked_at = COALESCE(revoked_at, now())
       WHERE case_id = $1 AND revoked_at IS NULL`,
      [input.caseId],
    );
    await client.query(
      `INSERT INTO client_document_upload_link (
         id, case_id, client_id, token_hash, created_by_id, expires_at
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [input.id, input.caseId, input.clientId, input.tokenHash, input.createdById ?? null, input.expiresAt],
    );
  });

  const created = await getLinkStatus(input.caseId);
  if (!created) throw new Error('No fue posible crear el enlace de carga');
  return created;
}

export async function revokeLink(caseId: string): Promise<void> {
  await query(
    `UPDATE client_document_upload_link
     SET revoked_at = COALESCE(revoked_at, now())
     WHERE case_id = $1 AND revoked_at IS NULL`,
    [caseId],
  );
}

export async function getValidLink(id: string, tokenHash: string): Promise<ValidUploadLinkRow | null> {
  return queryOne<ValidUploadLinkRow>(
    `SELECT l.id, l.case_id AS "caseId", l.client_id AS "clientId",
       cl.name AS "clientName", c.case_code AS "caseCode", c.title AS "caseTitle",
       c.brand, l.expires_at AS "expiresAt",
       c.assigned_juridico_id AS "assignedJuridicoId",
       c.commercial_id AS "commercialId"
     FROM client_document_upload_link l
     JOIN cases c ON c.id = l.case_id AND c.client_id = l.client_id
     JOIN crm_client cl ON cl.id = l.client_id
     WHERE l.id = $1 AND l.token_hash = $2
       AND l.revoked_at IS NULL AND l.expires_at > now()`,
    [id, tokenHash],
  );
}

export async function getPublicContext(link: ValidUploadLinkRow): Promise<PublicDocumentUploadContext> {
  const pendingDocuments = await query<PublicDocumentUploadContext['pendingDocuments'][number]>(
    `SELECT id AS "_id", COALESCE(NULLIF(description, ''), file_name, 'Documento requerido') AS description,
       category
     FROM case_document
     WHERE case_id = $1 AND is_required = TRUE AND is_visible_to_client = TRUE
       AND status <> 'recibido'
     ORDER BY created_at ASC`,
    [link.caseId],
  );
  return {
    brand: link.brand,
    caseCode: link.caseCode,
    caseTitle: link.caseTitle,
    clientName: link.clientName,
    expiresAt: link.expiresAt,
    pendingDocuments,
  };
}

export async function recordUploads(linkId: string, count: number): Promise<void> {
  await query(
    `UPDATE client_document_upload_link
     SET last_used_at = now(), upload_count = upload_count + $2
     WHERE id = $1`,
    [linkId, count],
  );
}
