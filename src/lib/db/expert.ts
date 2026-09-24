import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type { Expert, ExpertDocument, ExpertDocumentType, ExpertAvailability, ExpertValidationStatus, ExpertSeniority, ExpertCategory } from '@/lib/types';

const userObj = nestedObj('u', { _id: 'u.id', displayName: 'u.display_name', email: 'u.email', phone: 'u.phone' });
const validatedByObj = nestedObj('vb', { _id: 'vb.id', displayName: 'vb.display_name' });

const LIST_SELECT = `
  e.id AS "_id", e.created_at AS "_createdAt", e.updated_at AS "_updatedAt",
  e.disciplines, e.specialization, e.subespecialidad, e.experience_years AS "experienceYears",
  e.seniority, e.category, e.pregrado, e.num_especializaciones AS "numEspecializaciones",
  e.num_maestrias AS "numMaestrias", e.doctorado,
  e.professional_card AS "professionalCard", e.city, e.region, e.base_fee AS "baseFee",
  e.fee_currency AS "feeCurrency", e.availability, e.rating, e.total_cases AS "totalCases",
  e.completed_cases AS "completedCases", e.validation_status AS "validationStatus",
  e.validation_notes AS "validationNotes", e.tax_id AS "taxId",
  coalesce(ac.case_count, 0) AS "associatedCasesCount",
  ac.sole_case_id AS "soleAssociatedCaseId",
  ${userObj} AS "user",
  ${validatedByObj} AS "validatedBy"
`;

const JOINS = `
  LEFT JOIN crm_user u ON u.id = e.user_id
  LEFT JOIN crm_user vb ON vb.id = e.validated_by_id
  LEFT JOIN LATERAL (
    SELECT count(*)::int AS case_count,
      CASE WHEN count(*) = 1 THEN min(id) ELSE NULL END AS sole_case_id
    FROM cases
    WHERE assigned_expert_id = e.user_id AND status <> 'archivado'
  ) ac ON TRUE
`;

export interface ListExpertsParams {
  discipline?: string;
  city?: string;
  availability?: string;
  validationStatus?: string;
  seniority?: string;
  category?: string;
  search?: string;
  hasCases?: boolean;
  limit?: number;
  offset?: number;
}

function expertsWhere(p: ListExpertsParams): { clause: string; values: unknown[] } {
  const values: unknown[] = [
    p.discipline ?? '',
    p.city ?? '',
    p.availability ?? '',
    p.validationStatus ?? '',
    p.search ?? '',
    p.seniority ?? '',
    p.category ?? '',
    p.hasCases ?? false,
  ];
  const clause = `
    ($1 = '' OR $1 = ANY(e.disciplines))
    AND ($2 = '' OR e.city = $2)
    AND ($3 = '' OR e.availability = $3::expert_availability)
    AND ($4 = '' OR e.validation_status = $4::expert_validation_status)
    AND ($5 = '' OR e.specialization ILIKE $5 || '%' OR e.city ILIKE $5 || '%' OR e.tax_id ILIKE $5 || '%')
    AND ($6 = '' OR e.seniority = $6::expert_seniority)
    AND ($7 = '' OR e.category = $7::expert_category)
    AND ($8::boolean IS FALSE OR EXISTS (
      SELECT 1 FROM cases assigned_case
      WHERE assigned_case.assigned_expert_id = e.user_id
        AND assigned_case.status <> 'archivado'
    ))
  `;
  return { clause, values };
}

export async function listExperts(p: ListExpertsParams = {}): Promise<Expert[]> {
  const { clause, values } = expertsWhere(p);
  return query<Expert>(
    `SELECT ${LIST_SELECT} FROM expert e ${JOINS}
     WHERE ${clause} ORDER BY e.rating DESC LIMIT $9 OFFSET $10`,
    [...values, p.limit ?? 20, p.offset ?? 0],
  );
}

export async function countExperts(p: ListExpertsParams = {}): Promise<number> {
  const { clause, values } = expertsWhere(p);
  const row = await queryOne<{ count: number }>(
    `SELECT count(*)::int AS count FROM expert e WHERE ${clause}`,
    values,
  );
  return row?.count ?? 0;
}

export async function getExpertById(id: string): Promise<Expert | null> {
  return queryOne<Expert>(
    `SELECT ${LIST_SELECT},
       e.bank_name AS "bankName", e.bank_account_type AS "bankAccountType",
       e.bank_account_number AS "bankAccountNumber",
       e.bank_account_holder AS "bankAccountHolder",
       e.bank_holder_document AS "bankHolderDocument",
       e.cv_file_url AS "cvFileUrl", e.cv_file_name AS "cvFileName"
     FROM expert e ${JOINS} WHERE e.id = $1`,
    [id],
  );
}

export async function getExpertByUserId(userId: string): Promise<Expert | null> {
  return queryOne<Expert>(
    `SELECT ${LIST_SELECT},
       e.bank_name AS "bankName", e.bank_account_type AS "bankAccountType",
       e.bank_account_number AS "bankAccountNumber",
       e.bank_account_holder AS "bankAccountHolder",
       e.bank_holder_document AS "bankHolderDocument",
       e.cv_file_url AS "cvFileUrl", e.cv_file_name AS "cvFileName"
     FROM expert e ${JOINS} WHERE e.user_id = $1`,
    [userId],
  );
}

export async function getExpertCvAssetByUserId(userId: string): Promise<{
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
} | null> {
  return queryOne(
    `SELECT cv_file_url AS "fileUrl", cv_file_name AS "fileName",
       cv_mime_type AS "mimeType" FROM expert WHERE user_id = $1`,
    [userId],
  );
}

export async function listAvailableExpertsForDiscipline(discipline: string): Promise<Expert[]> {
  return query<Expert>(
    `SELECT e.id AS "_id", e.disciplines, e.specialization, e.experience_years AS "experienceYears",
       e.seniority, e.category,
       e.city, e.region, e.base_fee AS "baseFee", e.availability, e.rating,
       e.total_cases AS "totalCases", e.completed_cases AS "completedCases",
       ${userObj} AS "user"
     FROM expert e LEFT JOIN crm_user u ON u.id = e.user_id
     WHERE e.validation_status = 'activado' AND e.availability = 'disponible'
       AND u.active = TRUE AND u.role::text = 'perito'
       AND nullif(trim(e.bank_name), '') IS NOT NULL
       AND e.bank_account_type IS NOT NULL
       AND nullif(trim(e.bank_account_number), '') IS NOT NULL
       AND nullif(trim(e.bank_account_holder), '') IS NOT NULL
       AND nullif(trim(e.bank_holder_document), '') IS NOT NULL
       AND $1 = ANY(e.disciplines)
     ORDER BY e.rating DESC`,
    [discipline],
  );
}

/** Misma compuerta que alimenta el selector, aplicada de nuevo al confirmar. */
export async function isAssignableExpertForDiscipline(
  userId: string,
  discipline: string,
): Promise<boolean> {
  const row = await queryOne<{ allowed: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM expert e
       JOIN crm_user u ON u.id = e.user_id
       WHERE e.user_id = $1
         AND u.active = TRUE
         AND u.role::text = 'perito'
         AND e.validation_status = 'activado'
         AND e.availability = 'disponible'
         AND nullif(trim(e.bank_name), '') IS NOT NULL
         AND e.bank_account_type IS NOT NULL
         AND nullif(trim(e.bank_account_number), '') IS NOT NULL
         AND nullif(trim(e.bank_account_holder), '') IS NOT NULL
         AND nullif(trim(e.bank_holder_document), '') IS NOT NULL
         AND $2 = ANY(e.disciplines)
     ) AS allowed`,
    [userId, discipline],
  );
  return row?.allowed ?? false;
}

export interface ExpertAssignmentReadiness {
  expertId: string;
  userId: string | null;
  disciplines: string[];
  validationStatus: string;
  availability: string;
  userActive: boolean;
  userRole: string | null;
  bankComplete: boolean;
}

/** Estado completo que explica si un perfil puede recibir asignaciones. */
export async function getExpertAssignmentReadiness(expertId: string): Promise<ExpertAssignmentReadiness | null> {
  return queryOne<ExpertAssignmentReadiness>(
    `SELECT e.id AS "expertId", e.user_id AS "userId", e.disciplines,
       e.validation_status::text AS "validationStatus",
       e.availability::text AS availability,
       coalesce(u.active, FALSE) AS "userActive",
       u.role::text AS "userRole",
       (
         nullif(trim(e.bank_name), '') IS NOT NULL
         AND e.bank_account_type IS NOT NULL
         AND nullif(trim(e.bank_account_number), '') IS NOT NULL
         AND nullif(trim(e.bank_account_holder), '') IS NOT NULL
         AND nullif(trim(e.bank_holder_document), '') IS NOT NULL
       ) AS "bankComplete"
     FROM expert e
     LEFT JOIN crm_user u ON u.id = e.user_id
     WHERE e.id = $1`,
    [expertId],
  );
}

export async function countExpertsByStatus(): Promise<{ candidato: number; en_evaluacion: number; activado: number; rechazado: number; total: number }> {
  const row = await queryOne<{ candidato: number; en_evaluacion: number; activado: number; rechazado: number; total: number }>(
    `SELECT
       count(*) FILTER (WHERE validation_status = 'candidato')::int AS candidato,
       count(*) FILTER (WHERE validation_status = 'en_evaluacion')::int AS en_evaluacion,
       count(*) FILTER (WHERE validation_status = 'activado')::int AS activado,
       count(*) FILTER (WHERE validation_status = 'rechazado')::int AS rechazado,
       count(*)::int AS total
     FROM expert`,
  );
  return row ?? { candidato: 0, en_evaluacion: 0, activado: 0, rechazado: 0, total: 0 };
}

export async function reportExpertsPerformance(): Promise<Expert[]> {
  return query<Expert>(
    `SELECT e.id AS "_id", e.disciplines, e.specialization, e.experience_years AS "experienceYears",
       e.seniority, e.category,
       e.rating, e.total_cases AS "totalCases", e.completed_cases AS "completedCases", e.availability,
       ${nestedObj('u', { _id: 'u.id', displayName: 'u.display_name', email: 'u.email' })} AS "user"
     FROM expert e LEFT JOIN crm_user u ON u.id = e.user_id
     WHERE e.validation_status = 'activado' ORDER BY e.rating DESC`,
  );
}

export interface ExpertInput {
  userId?: string | null;
  disciplines?: string[];
  specialization?: string | null;
  subespecialidad?: string | null;
  experienceYears?: number | null;
  seniority?: ExpertSeniority | null;
  category?: ExpertCategory | null;
  pregrado?: boolean;
  numEspecializaciones?: number;
  numMaestrias?: number;
  doctorado?: boolean;
  professionalCard?: string | null;
  cvFileUrl?: string | null;
  cvFileAssetId?: string | null;
  cvFileName?: string | null;
  cvMimeType?: string | null;
  cvFileSize?: number | null;
  city?: string | null;
  region?: string | null;
  baseFee?: number | null;
  feeCurrency?: string;
  availability?: ExpertAvailability;
  rating?: number;
  totalCases?: number;
  completedCases?: number;
  validationStatus?: ExpertValidationStatus;
  validatedById?: string | null;
  validationNotes?: string | null;
  bankName?: string | null;
  bankAccountType?: 'ahorros' | 'corriente' | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  bankHolderDocument?: string | null;
  taxId?: string | null;
}

function toColumns(input: Partial<ExpertInput>): Record<string, unknown> {
  return pruneUndefined({
    user_id: input.userId,
    disciplines: input.disciplines,
    specialization: input.specialization,
    subespecialidad: input.subespecialidad,
    experience_years: input.experienceYears,
    seniority: input.seniority,
    category: input.category,
    pregrado: input.pregrado,
    num_especializaciones: input.numEspecializaciones,
    num_maestrias: input.numMaestrias,
    doctorado: input.doctorado,
    professional_card: input.professionalCard,
    cv_file_url: input.cvFileUrl,
    cv_file_asset_id: input.cvFileAssetId,
    cv_file_name: input.cvFileName,
    cv_mime_type: input.cvMimeType,
    cv_file_size: input.cvFileSize,
    city: input.city,
    region: input.region,
    base_fee: input.baseFee,
    fee_currency: input.feeCurrency,
    availability: input.availability,
    rating: input.rating,
    total_cases: input.totalCases,
    completed_cases: input.completedCases,
    validation_status: input.validationStatus,
    validated_by_id: input.validatedById,
    validation_notes: input.validationNotes,
    bank_name: input.bankName,
    bank_account_type: input.bankAccountType,
    bank_account_number: input.bankAccountNumber,
    bank_account_holder: input.bankAccountHolder,
    bank_holder_document: input.bankHolderDocument,
    tax_id: input.taxId,
  });
}

export async function createExpert(input: ExpertInput): Promise<Expert | null> {
  const id = newId();
  const { text, values } = buildInsert('expert', { id, ...toColumns(input) });
  await query(text, values);
  return getExpertById(id);
}

export async function updateExpert(id: string, patch: Partial<ExpertInput>): Promise<Expert | null> {
  const upd = buildUpdate('expert', id, toColumns(patch));
  if (upd) await query(upd.text, upd.values);
  return getExpertById(id);
}

export async function deleteExpert(id: string): Promise<void> {
  await query('DELETE FROM expert WHERE id = $1', [id]);
}

// --- documentos del perito (cédula, certificaciones, soportes, otros) ---------
export interface ExpertDocumentInput {
  expertId: string;
  docType: ExpertDocumentType;
  fileUrl: string;
  fileAssetId: string;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
  uploadedById?: string | null;
}

const DOCUMENT_SELECT = `
  d.id AS "_id", d.created_at AS "_createdAt", d.expert_id AS "expertId",
  d.doc_type AS "docType", d.file_name AS "fileName", d.mime_type AS "mimeType",
  d.file_size AS "fileSize", ub.display_name AS "uploadedByName"`;

export async function listExpertDocuments(expertId: string): Promise<ExpertDocument[]> {
  return query<ExpertDocument>(
    `SELECT ${DOCUMENT_SELECT}
     FROM expert_certification_file d
     LEFT JOIN crm_user ub ON ub.id = d.uploaded_by_id
     WHERE d.expert_id = $1
     ORDER BY d.doc_type, d.created_at`,
    [expertId],
  );
}

/** Fila con la URL persistente: solo para descargas/borrados en el servidor. */
export async function getExpertDocumentAsset(id: string): Promise<{
  _id: string;
  expertId: string;
  fileUrl: string | null;
  fileAssetId: string | null;
  fileName: string | null;
  mimeType: string | null;
} | null> {
  return queryOne(
    `SELECT id AS "_id", expert_id AS "expertId", file_url AS "fileUrl",
       file_asset_id AS "fileAssetId", file_name AS "fileName", mime_type AS "mimeType"
     FROM expert_certification_file WHERE id = $1`,
    [id],
  );
}

export async function addExpertDocument(input: ExpertDocumentInput): Promise<string> {
  const id = newId();
  const { text, values } = buildInsert('expert_certification_file', {
    id,
    expert_id: input.expertId,
    doc_type: input.docType,
    file_url: input.fileUrl,
    file_asset_id: input.fileAssetId,
    file_name: input.fileName,
    mime_type: input.mimeType ?? null,
    file_size: input.fileSize ?? null,
    uploaded_by_id: input.uploadedById ?? null,
  });
  await query(text, values);
  return id;
}

export async function deleteExpertDocument(id: string): Promise<void> {
  await query('DELETE FROM expert_certification_file WHERE id = $1', [id]);
}

/** Datos de la hoja de vida (expert.cv_file_*) con su URL persistente. */
export async function getExpertCvAsset(expertId: string): Promise<{
  fileUrl: string | null;
  fileAssetId: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
} | null> {
  return queryOne(
    `SELECT cv_file_url AS "fileUrl", cv_file_asset_id AS "fileAssetId", cv_file_name AS "fileName",
       cv_mime_type AS "mimeType", cv_file_size AS "fileSize" FROM expert WHERE id = $1`,
    [expertId],
  );
}

export async function clearExpertCv(expertId: string): Promise<void> {
  await query(
    `UPDATE expert SET cv_file_url = NULL, cv_file_asset_id = NULL, cv_file_name = NULL,
       cv_mime_type = NULL, cv_file_size = NULL WHERE id = $1`,
    [expertId],
  );
}
