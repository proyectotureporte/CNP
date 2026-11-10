import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type {
  CaseDocument,
  CaseDocumentReviewStatus,
  CaseDocumentStatus,
  ClientPendingDocument,
  DocumentCategory,
} from '@/lib/types';

const uploadedByObj = nestedObj('u', { _id: 'u.id', displayName: 'u.display_name' });

const SELECT = `
  d.id AS "_id", d.created_at AS "_createdAt", d.category,
  d.uploaded_at AS "uploadedAt",
  d.status, d.is_required AS "isRequired",
  d.file_name AS "fileName", d.file_size AS "fileSize", d.mime_type AS "mimeType",
  d.version, d.is_visible_to_client AS "isVisibleToClient", d.description,
  d.review_status AS "reviewStatus", d.review_note AS "reviewNote",
  d.reviewed_by_name AS "reviewedByName", d.reviewed_at AS "reviewedAt",
  d.supersedes_document_id AS "supersedesDocumentId", d.superseded_at AS "supersededAt",
  d.uploaded_by_name AS "uploadedByName",
  (d.upload_link_id IS NOT NULL) AS "uploadedViaLink",
  ${uploadedByObj} AS "uploadedBy",
  d.file_url AS "fileUrl"
`;

const FROM = `FROM case_document d LEFT JOIN crm_user u ON u.id = d.uploaded_by_id`;

/** Expediente completo (incluye versiones reemplazadas; la UI las agrupa). */
export async function listCaseDocuments(caseId: string, category = ''): Promise<CaseDocument[]> {
  return query<CaseDocument>(
    `SELECT ${SELECT} ${FROM}
     WHERE d.case_id = $1 AND ($2 = '' OR d.category = $2::document_category)
     ORDER BY d.created_at DESC`,
    [caseId, category],
  );
}

/** Vista del cliente: solo versiones vigentes marcadas visibles. */
export async function listClientVisibleDocuments(caseId: string): Promise<CaseDocument[]> {
  return query<CaseDocument>(
    `SELECT ${SELECT} ${FROM}
     WHERE d.case_id = $1 AND d.is_visible_to_client = TRUE AND d.superseded_at IS NULL
     ORDER BY d.created_at DESC`,
    [caseId],
  );
}

/** Cadena de versiones anteriores de un documento (la más reciente primero). */
export async function listPreviousVersions(documentId: string): Promise<CaseDocument[]> {
  return query<CaseDocument>(
    `WITH RECURSIVE chain AS (
       SELECT d0.supersedes_document_id AS id, 1 AS depth FROM case_document d0 WHERE d0.id = $1
       UNION ALL
       SELECT dn.supersedes_document_id, chain.depth + 1
       FROM chain JOIN case_document dn ON dn.id = chain.id
       WHERE dn.supersedes_document_id IS NOT NULL AND chain.depth < 50
     )
     SELECT ${SELECT} ${FROM}
     JOIN chain ON chain.id = d.id
     ORDER BY d.version DESC`,
    [documentId],
  );
}

/**
 * Documentos que el cliente todavía debe aportar: requeridos visibles sin
 * recibir y versiones vigentes devueltas con "requiere corrección".
 */
export async function listClientPendingDocuments(caseId: string): Promise<ClientPendingDocument[]> {
  return query<ClientPendingDocument>(
    `SELECT id AS "_id",
       COALESCE(NULLIF(description, ''), file_name, 'Documento requerido') AS description,
       category,
       CASE WHEN review_status = 'requiere_correccion' THEN 'correccion' ELSE 'requerido' END AS reason,
       review_note AS "reviewNote", file_name AS "fileName", version
     FROM case_document
     WHERE case_id = $1 AND is_visible_to_client = TRUE AND superseded_at IS NULL
       AND category <> 'dictamen'
       AND (
         (is_required = TRUE AND status <> 'recibido')
         OR review_status = 'requiere_correccion'
       )
     ORDER BY created_at ASC`,
    [caseId],
  );
}

export async function getCaseDocumentById(id: string): Promise<CaseDocument | null> {
  return queryOne<CaseDocument>(`SELECT ${SELECT} ${FROM} WHERE d.id = $1`, [id]);
}

export async function getCaseDocumentCaseId(id: string): Promise<string | null> {
  const row = await queryOne<{ caseId: string }>(
    'SELECT case_id AS "caseId" FROM case_document WHERE id = $1',
    [id],
  );
  return row?.caseId ?? null;
}

export async function getCaseDocumentAssetRow(id: string): Promise<{
  caseId: string;
  category: DocumentCategory;
  isVisibleToClient: boolean;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
} | null> {
  return queryOne(
    `SELECT case_id AS "caseId", category,
       is_visible_to_client AS "isVisibleToClient", file_url AS "fileUrl",
       file_name AS "fileName", mime_type AS "mimeType"
     FROM case_document WHERE id = $1`,
    [id],
  );
}

export async function countCaseDocuments(caseId: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    'SELECT count(*)::int AS count FROM case_document WHERE case_id = $1',
    [caseId],
  );
  return row?.count ?? 0;
}

export interface CaseDocumentInput {
  caseId: string;
  uploadedById?: string | null;
  uploadedByName?: string | null;
  category?: DocumentCategory;
  status?: CaseDocumentStatus;
  isRequired?: boolean;
  fileUrl?: string | null;
  fileAssetId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  version?: number;
  isVisibleToClient?: boolean;
  description?: string | null;
  uploadedAt?: string | null;
  uploadLinkId?: string | null;
  reviewStatus?: CaseDocumentReviewStatus | null;
  reviewNote?: string | null;
  reviewedById?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  supersedesDocumentId?: string | null;
  supersededAt?: string | null;
}

export async function createCaseDocument(input: CaseDocumentInput): Promise<CaseDocument | null> {
  const id = newId();
  const { text, values } = buildInsert('case_document', {
    id,
    case_id: input.caseId,
    uploaded_by_id: input.uploadedById && input.uploadedById !== 'admin' ? input.uploadedById : null,
    uploaded_by_name: input.uploadedByName ?? null,
    category: input.category ?? 'documentos_caso',
    status: input.status ?? (input.fileUrl ? 'recibido' : 'no_recibido'),
    is_required: input.isRequired ?? false,
    file_url: input.fileUrl ?? null,
    file_asset_id: input.fileAssetId ?? null,
    file_name: input.fileName ?? null,
    mime_type: input.mimeType ?? null,
    file_size: input.fileSize ?? null,
    version: input.version ?? 1,
    is_visible_to_client: input.isVisibleToClient ?? false,
    description: input.description ?? null,
    uploaded_at: input.uploadedAt ?? (input.fileUrl ? new Date().toISOString() : null),
    upload_link_id: input.uploadLinkId ?? null,
    review_status: input.reviewStatus ?? null,
    review_note: input.reviewNote ?? null,
    reviewed_by_id: input.reviewedById && input.reviewedById !== 'admin' ? input.reviewedById : null,
    reviewed_by_name: input.reviewedByName ?? null,
    reviewed_at: input.reviewedAt ?? null,
    supersedes_document_id: input.supersedesDocumentId ?? null,
  });
  await query(text, values);
  return getCaseDocumentById(id);
}

export async function updateCaseDocument(
  id: string,
  patch: Partial<Omit<CaseDocumentInput, 'caseId'>>,
): Promise<CaseDocument | null> {
  const data = pruneUndefined({
    category: patch.category,
    is_visible_to_client: patch.isVisibleToClient,
    description: patch.description,
    status: patch.status,
    is_required: patch.isRequired,
    file_url: patch.fileUrl,
    file_asset_id: patch.fileAssetId,
    file_name: patch.fileName,
    mime_type: patch.mimeType,
    file_size: patch.fileSize,
    version: patch.version,
    uploaded_by_id: patch.uploadedById === 'admin' ? null : patch.uploadedById,
    uploaded_by_name: patch.uploadedByName,
    uploaded_at: patch.uploadedAt,
    upload_link_id: patch.uploadLinkId,
    review_status: patch.reviewStatus,
    review_note: patch.reviewNote,
    reviewed_by_id: patch.reviewedById === 'admin' ? null : patch.reviewedById,
    reviewed_by_name: patch.reviewedByName,
    reviewed_at: patch.reviewedAt,
    supersedes_document_id: patch.supersedesDocumentId,
    superseded_at: patch.supersededAt,
  });
  const upd = buildUpdate('case_document', id, data);
  if (upd) await query(upd.text, upd.values);
  return getCaseDocumentById(id);
}

/**
 * Registra una versión nueva de un documento devuelto: crea la fila nueva
 * (versión + 1, misma categoría/descripción/requerido) y marca la anterior
 * como reemplazada. La anterior conserva su archivo y su observación.
 */
export async function createDocumentVersion(
  previous: CaseDocument,
  caseId: string,
  file: {
    fileUrl: string;
    fileAssetId: string | null;
    fileName: string;
    mimeType: string;
    fileSize: number;
    uploadedById?: string | null;
    uploadedByName?: string | null;
    uploadLinkId?: string | null;
    reviewStatus?: CaseDocumentReviewStatus;
    isVisibleToClient?: boolean;
  },
): Promise<CaseDocument | null> {
  const created = await createCaseDocument({
    caseId,
    category: previous.category,
    description: previous.description ?? null,
    isRequired: previous.isRequired,
    status: 'recibido',
    isVisibleToClient: file.isVisibleToClient ?? previous.isVisibleToClient,
    version: (previous.version ?? 1) + 1,
    fileUrl: file.fileUrl,
    fileAssetId: file.fileAssetId,
    fileName: file.fileName,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    uploadedById: file.uploadedById ?? null,
    uploadedByName: file.uploadedByName ?? null,
    uploadLinkId: file.uploadLinkId ?? null,
    reviewStatus: file.reviewStatus ?? 'pendiente_revision',
    supersedesDocumentId: previous._id,
  });
  if (created) {
    await query('UPDATE case_document SET superseded_at = now() WHERE id = $1', [previous._id]);
  }
  return created;
}

export async function deleteCaseDocument(id: string): Promise<void> {
  await query('DELETE FROM case_document WHERE id = $1', [id]);
}
