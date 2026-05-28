import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type { CaseDocument, DocumentCategory } from '@/lib/types';

const uploadedByObj = nestedObj('u', { _id: 'u.id', displayName: 'u.display_name' });

const SELECT = `
  d.id AS "_id", d.created_at AS "_createdAt", d.category,
  d.file_name AS "fileName", d.file_size AS "fileSize", d.mime_type AS "mimeType",
  d.version, d.is_visible_to_client AS "isVisibleToClient", d.description,
  d.uploaded_by_name AS "uploadedByName",
  ${uploadedByObj} AS "uploadedBy",
  d.file_url AS "fileUrl"
`;

const FROM = `FROM case_document d LEFT JOIN crm_user u ON u.id = d.uploaded_by_id`;

export async function listCaseDocuments(caseId: string, category = ''): Promise<CaseDocument[]> {
  return query<CaseDocument>(
    `SELECT ${SELECT} ${FROM}
     WHERE d.case_id = $1 AND ($2 = '' OR d.category = $2::document_category)
     ORDER BY d.created_at DESC`,
    [caseId, category],
  );
}

export async function listClientVisibleDocuments(caseId: string): Promise<CaseDocument[]> {
  return query<CaseDocument>(
    `SELECT ${SELECT} ${FROM}
     WHERE d.case_id = $1 AND d.is_visible_to_client = TRUE
     ORDER BY d.created_at DESC`,
    [caseId],
  );
}

export async function getCaseDocumentById(id: string): Promise<CaseDocument | null> {
  return queryOne<CaseDocument>(`SELECT ${SELECT} ${FROM} WHERE d.id = $1`, [id]);
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
  fileUrl?: string | null;
  fileAssetId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  version?: number;
  isVisibleToClient?: boolean;
  description?: string | null;
}

export async function createCaseDocument(input: CaseDocumentInput): Promise<CaseDocument | null> {
  const id = newId();
  const { text, values } = buildInsert('case_document', {
    id,
    case_id: input.caseId,
    uploaded_by_id: input.uploadedById && input.uploadedById !== 'admin' ? input.uploadedById : null,
    uploaded_by_name: input.uploadedByName ?? null,
    category: input.category ?? 'otro',
    file_url: input.fileUrl ?? null,
    file_asset_id: input.fileAssetId ?? null,
    file_name: input.fileName ?? null,
    mime_type: input.mimeType ?? null,
    file_size: input.fileSize ?? null,
    version: input.version ?? 1,
    is_visible_to_client: input.isVisibleToClient ?? false,
    description: input.description ?? null,
  });
  await query(text, values);
  return getCaseDocumentById(id);
}

export async function updateCaseDocument(
  id: string,
  patch: Partial<Pick<CaseDocumentInput, 'category' | 'isVisibleToClient' | 'description'>>,
): Promise<CaseDocument | null> {
  const data = pruneUndefined({
    category: patch.category,
    is_visible_to_client: patch.isVisibleToClient,
    description: patch.description,
  });
  const upd = buildUpdate('case_document', id, data);
  if (upd) await query(upd.text, upd.values);
  return getCaseDocumentById(id);
}

export async function deleteCaseDocument(id: string): Promise<void> {
  await query('DELETE FROM case_document WHERE id = $1', [id]);
}
