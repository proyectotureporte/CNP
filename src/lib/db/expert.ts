import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type { Expert, ExpertAvailability, ExpertValidationStatus } from '@/lib/types';

const userObj = nestedObj('u', { _id: 'u.id', displayName: 'u.display_name', email: 'u.email', phone: 'u.phone' });
const validatedByObj = nestedObj('vb', { _id: 'vb.id', displayName: 'vb.display_name' });

const LIST_SELECT = `
  e.id AS "_id", e.created_at AS "_createdAt", e.updated_at AS "_updatedAt",
  e.disciplines, e.specialization, e.experience_years AS "experienceYears",
  e.professional_card AS "professionalCard", e.city, e.region, e.base_fee AS "baseFee",
  e.fee_currency AS "feeCurrency", e.availability, e.rating, e.total_cases AS "totalCases",
  e.completed_cases AS "completedCases", e.validation_status AS "validationStatus",
  e.validation_notes AS "validationNotes", e.tax_id AS "taxId",
  ${userObj} AS "user",
  ${validatedByObj} AS "validatedBy"
`;

const JOINS = `LEFT JOIN crm_user u ON u.id = e.user_id LEFT JOIN crm_user vb ON vb.id = e.validated_by_id`;

export interface ListExpertsParams {
  discipline?: string;
  city?: string;
  availability?: string;
  validationStatus?: string;
  search?: string;
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
  ];
  const clause = `
    ($1 = '' OR $1 = ANY(e.disciplines))
    AND ($2 = '' OR e.city = $2)
    AND ($3 = '' OR e.availability = $3::expert_availability)
    AND ($4 = '' OR e.validation_status = $4::expert_validation_status)
    AND ($5 = '' OR e.specialization ILIKE $5 || '%' OR e.city ILIKE $5 || '%' OR e.tax_id ILIKE $5 || '%')
  `;
  return { clause, values };
}

export async function listExperts(p: ListExpertsParams = {}): Promise<Expert[]> {
  const { clause, values } = expertsWhere(p);
  return query<Expert>(
    `SELECT ${LIST_SELECT} FROM expert e ${JOINS}
     WHERE ${clause} ORDER BY e.rating DESC LIMIT $6 OFFSET $7`,
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
       e.cv_file_url AS "cvFileUrl",
       ARRAY(SELECT file_url FROM expert_certification_file WHERE expert_id = e.id ORDER BY sort_order) AS "certificationUrls"
     FROM expert e ${JOINS} WHERE e.id = $1`,
    [id],
  );
}

export async function getExpertByUserId(userId: string): Promise<Expert | null> {
  return queryOne<Expert>(
    `SELECT ${LIST_SELECT} FROM expert e ${JOINS} WHERE e.user_id = $1`,
    [userId],
  );
}

export async function listAvailableExpertsForDiscipline(discipline: string): Promise<Expert[]> {
  return query<Expert>(
    `SELECT e.id AS "_id", e.disciplines, e.specialization, e.experience_years AS "experienceYears",
       e.city, e.region, e.base_fee AS "baseFee", e.availability, e.rating,
       e.total_cases AS "totalCases", e.completed_cases AS "completedCases",
       ${userObj} AS "user"
     FROM expert e LEFT JOIN crm_user u ON u.id = e.user_id
     WHERE e.validation_status = 'aprobado' AND e.availability = 'disponible' AND $1 = ANY(e.disciplines)
     ORDER BY e.rating DESC`,
    [discipline],
  );
}

export async function countExpertsByStatus(): Promise<{ pendiente: number; aprobado: number; rechazado: number; total: number }> {
  const row = await queryOne<{ pendiente: number; aprobado: number; rechazado: number; total: number }>(
    `SELECT
       count(*) FILTER (WHERE validation_status = 'pendiente')::int AS pendiente,
       count(*) FILTER (WHERE validation_status = 'aprobado')::int AS aprobado,
       count(*) FILTER (WHERE validation_status = 'rechazado')::int AS rechazado,
       count(*)::int AS total
     FROM expert`,
  );
  return row ?? { pendiente: 0, aprobado: 0, rechazado: 0, total: 0 };
}

export async function reportExpertsPerformance(): Promise<Expert[]> {
  return query<Expert>(
    `SELECT e.id AS "_id", e.disciplines, e.specialization, e.experience_years AS "experienceYears",
       e.rating, e.total_cases AS "totalCases", e.completed_cases AS "completedCases", e.availability,
       ${nestedObj('u', { _id: 'u.id', displayName: 'u.display_name', email: 'u.email' })} AS "user"
     FROM expert e LEFT JOIN crm_user u ON u.id = e.user_id
     WHERE e.validation_status = 'aprobado' ORDER BY e.rating DESC`,
  );
}

export interface ExpertInput {
  userId?: string | null;
  disciplines?: string[];
  specialization?: string | null;
  experienceYears?: number | null;
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
  taxId?: string | null;
}

function toColumns(input: Partial<ExpertInput>): Record<string, unknown> {
  return pruneUndefined({
    user_id: input.userId,
    disciplines: input.disciplines,
    specialization: input.specialization,
    experience_years: input.experienceYears,
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

// --- archivos de certificación ----------------------------------------------
export interface CertificationFileInput {
  expertId: string;
  fileUrl?: string | null;
  fileAssetId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  sortOrder?: number;
}

export async function addCertificationFile(input: CertificationFileInput): Promise<string> {
  const id = newId();
  const { text, values } = buildInsert('expert_certification_file', {
    id,
    expert_id: input.expertId,
    file_url: input.fileUrl ?? null,
    file_asset_id: input.fileAssetId ?? null,
    file_name: input.fileName ?? null,
    mime_type: input.mimeType ?? null,
    file_size: input.fileSize ?? null,
    sort_order: input.sortOrder ?? 0,
  });
  await query(text, values);
  return id;
}

export async function deleteCertificationFile(id: string): Promise<void> {
  await query('DELETE FROM expert_certification_file WHERE id = $1', [id]);
}
