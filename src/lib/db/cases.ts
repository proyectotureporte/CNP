import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type { Case, CaseExpanded } from '@/lib/types';

// --- fragmentos de objetos anidados (refs -> {...}) -------------------------
const clientList = nestedObj('cl', { _id: 'cl.id', name: 'cl.name', email: 'cl.email', company: 'cl.company', brand: 'cl.brand' });
const clientFull = nestedObj('cl', { _id: 'cl.id', name: 'cl.name', email: 'cl.email', company: 'cl.company', phone: 'cl.phone', brand: 'cl.brand' });
const userEmail = (a: string) => nestedObj(a, { _id: `${a}.id`, displayName: `${a}.display_name`, email: `${a}.email` });
const userName = (a: string) => nestedObj(a, { _id: `${a}.id`, displayName: `${a}.display_name` });

const SCALARS = `
  c.id AS "_id", c.created_at AS "_createdAt", c.updated_at AS "_updatedAt",
  c.brand, c.case_code AS "caseCode", c.title, c.description, c.discipline, c.status,
  c.status_changed_by_role AS "statusChangedByRole", c.complexity, c.priority,
  c.channel, c.commercial_status AS "commercialStatus", c.loss_reason AS "lossReason",
  c.execution_start_date AS "executionStartDate", c.execution_deadline AS "executionDeadline",
  c.estimated_amount AS "estimatedAmount", c.has_hearing AS "hasHearing",
  c.hearing_date AS "hearingDate", c.hearing_link AS "hearingLink", c.deadline_date AS "deadlineDate",
  c.city, c.court_name AS "courtName", c.case_number AS "caseNumber", c.risk_score AS "riskScore"
`;

const JOINS = `
  LEFT JOIN crm_client cl ON cl.id = c.client_id
  LEFT JOIN crm_user cm ON cm.id = c.commercial_id
  LEFT JOIN crm_user ta ON ta.id = c.technical_analyst_id
  LEFT JOIN crm_user ae ON ae.id = c.assigned_expert_id
  LEFT JOIN crm_user af ON af.id = c.assigned_financiero_id
  LEFT JOIN crm_user cb ON cb.id = c.created_by_id
`;

export interface ListCasesParams {
  status?: string;
  discipline?: string;
  brand?: string;
  search?: string;
  deadlineThreshold?: string | null;
  financieroId?: string;
  limit?: number;
  offset?: number;
}

function casesWhere(p: ListCasesParams): { clause: string; values: unknown[] } {
  const values: unknown[] = [
    p.status ?? '',
    p.discipline ?? '',
    p.brand ?? '',
    p.search ?? '',
    p.deadlineThreshold ?? '',
    p.financieroId ?? '',
  ];
  const clause = `
    c.status <> 'archivado'
    AND ($1 = '' OR c.status = $1::case_status)
    AND ($2 = '' OR c.discipline = $2::case_discipline)
    AND ($3 = '' OR c.brand = $3::brand)
    AND ($4 = '' OR c.title ILIKE $4 || '%' OR c.case_code ILIKE $4 || '%' OR c.city ILIKE $4 || '%')
    AND ($5 = '' OR (c.deadline_date IS NOT NULL AND c.deadline_date <= $5::timestamptz AND c.status <> 'cancelado'))
    AND ($6 = '' OR c.assigned_financiero_id = $6)
  `;
  return { clause, values };
}

export async function listCases(p: ListCasesParams = {}): Promise<CaseExpanded[]> {
  const { clause, values } = casesWhere(p);
  const limit = p.limit ?? 20;
  const offset = p.offset ?? 0;
  return query<CaseExpanded>(
    `SELECT
       c.id AS "_id", c.created_at AS "_createdAt", c.updated_at AS "_updatedAt",
       c.brand, c.case_code AS "caseCode", c.title, c.discipline, c.status,
       c.status_changed_by_role AS "statusChangedByRole", c.complexity, c.priority,
       c.channel, c.commercial_status AS "commercialStatus",
       c.execution_start_date AS "executionStartDate", c.execution_deadline AS "executionDeadline",
       c.estimated_amount AS "estimatedAmount", c.has_hearing AS "hasHearing",
       c.hearing_date AS "hearingDate", c.hearing_link AS "hearingLink", c.deadline_date AS "deadlineDate",
       c.city, c.court_name AS "courtName", c.case_number AS "caseNumber",
       ${clientList} AS "client",
       ${userEmail('cm')} AS "commercial",
       ${userEmail('ae')} AS "assignedExpert",
       ${userEmail('af')} AS "assignedFinanciero"
     FROM cases c ${JOINS}
     WHERE ${clause}
     ORDER BY c.created_at DESC
     LIMIT $7 OFFSET $8`,
    [...values, limit, offset],
  );
}

export async function countCases(p: ListCasesParams = {}): Promise<number> {
  const { clause, values } = casesWhere(p);
  const row = await queryOne<{ count: number }>(
    `SELECT count(*)::int AS count FROM cases c WHERE ${clause}`,
    values,
  );
  return row?.count ?? 0;
}

export async function getCaseById(id: string): Promise<CaseExpanded | null> {
  return queryOne<CaseExpanded>(
    `SELECT ${SCALARS},
       ${clientFull} AS "client",
       ${userEmail('cm')} AS "commercial",
       ${userEmail('ta')} AS "technicalAnalyst",
       ${userEmail('ae')} AS "assignedExpert",
       ${userEmail('af')} AS "assignedFinanciero",
       ${userName('cb')} AS "createdBy"
     FROM cases c ${JOINS}
     WHERE c.id = $1`,
    [id],
  );
}

export async function countCasesByStatus(): Promise<{ creado: number; gestionado: number; cancelado: number; total: number }> {
  const row = await queryOne<{ creado: number; gestionado: number; cancelado: number; total: number }>(
    `SELECT
       count(*) FILTER (WHERE status = 'creado')::int AS creado,
       count(*) FILTER (WHERE status = 'gestionado')::int AS gestionado,
       count(*) FILTER (WHERE status = 'cancelado')::int AS cancelado,
       count(*)::int AS total
     FROM cases`,
  );
  return row ?? { creado: 0, gestionado: 0, cancelado: 0, total: 0 };
}

/** Último caseCode con un prefijo dado (p.ej. "CNP-2026-"), para auto-numerar. */
export async function getLatestCaseCode(prefix: string): Promise<string | null> {
  const row = await queryOne<{ caseCode: string }>(
    `SELECT case_code AS "caseCode" FROM cases
     WHERE case_code LIKE $1 || '%' ORDER BY case_code DESC LIMIT 1`,
    [prefix],
  );
  return row?.caseCode ?? null;
}

export async function listCasesByUser(userId: string): Promise<CaseExpanded[]> {
  return query<CaseExpanded>(
    `SELECT
       c.id AS "_id", c.created_at AS "_createdAt", c.case_code AS "caseCode", c.title,
       c.discipline, c.status, c.complexity, c.priority,
       ${nestedObj('cl', { _id: 'cl.id', name: 'cl.name', company: 'cl.company' })} AS "client",
       ${userName('cm')} AS "commercial"
     FROM cases c
     LEFT JOIN crm_client cl ON cl.id = c.client_id
     LEFT JOIN crm_user cm ON cm.id = c.commercial_id
     WHERE c.status <> 'archivado' AND (
       c.commercial_id = $1 OR c.technical_analyst_id = $1 OR c.assigned_expert_id = $1 OR c.created_by_id = $1
     )
     ORDER BY c.created_at DESC`,
    [userId],
  );
}

export async function listCasesByClient(clientId: string): Promise<CaseExpanded[]> {
  return query<CaseExpanded>(
    `SELECT
       c.id AS "_id", c.created_at AS "_createdAt", c.case_code AS "caseCode", c.title,
       c.discipline, c.status, c.complexity, c.priority,
       ${userName('cm')} AS "commercial"
     FROM cases c
     LEFT JOIN crm_user cm ON cm.id = c.commercial_id
     WHERE c.client_id = $1 AND c.status <> 'archivado'
     ORDER BY c.created_at DESC`,
    [clientId],
  );
}

/** Portal cliente: casos con sus refs principales. */
export async function listCasesForClient(clientId: string): Promise<CaseExpanded[]> {
  return query<CaseExpanded>(
    `SELECT
       c.id AS "_id", c.created_at AS "_createdAt", c.updated_at AS "_updatedAt",
       c.brand, c.case_code AS "caseCode", c.title, c.discipline, c.status, c.complexity, c.priority,
       c.estimated_amount AS "estimatedAmount", c.has_hearing AS "hasHearing",
       c.hearing_date AS "hearingDate", c.deadline_date AS "deadlineDate",
       c.city, c.court_name AS "courtName", c.case_number AS "caseNumber",
       ${clientList} AS "client",
       ${userEmail('cm')} AS "commercial",
       ${userEmail('ae')} AS "assignedExpert"
     FROM cases c
     LEFT JOIN crm_client cl ON cl.id = c.client_id
     LEFT JOIN crm_user cm ON cm.id = c.commercial_id
     LEFT JOIN crm_user ae ON ae.id = c.assigned_expert_id
     WHERE c.client_id = $1 AND c.status <> 'archivado'
     ORDER BY c.created_at DESC`,
    [clientId],
  );
}

// --- Reportes ---------------------------------------------------------------
export interface ReportCasesParams {
  startDate?: string;
  endDate?: string;
  discipline?: string;
  status?: string;
}

export async function reportCases(p: ReportCasesParams = {}): Promise<CaseExpanded[]> {
  return query<CaseExpanded>(
    `SELECT
       c.id AS "_id", c.created_at AS "_createdAt", c.case_code AS "caseCode", c.title,
       c.discipline, c.status, c.complexity, c.priority, c.estimated_amount AS "estimatedAmount",
       ${nestedObj('cl', { _id: 'cl.id', name: 'cl.name', company: 'cl.company' })} AS "client",
       ${userName('cm')} AS "commercial",
       ${userName('ae')} AS "assignedExpert"
     FROM cases c
     LEFT JOIN crm_client cl ON cl.id = c.client_id
     LEFT JOIN crm_user cm ON cm.id = c.commercial_id
     LEFT JOIN crm_user ae ON ae.id = c.assigned_expert_id
     WHERE ($1 = '' OR c.created_at >= $1::timestamptz)
       AND ($2 = '' OR c.created_at <= $2::timestamptz)
       AND ($3 = '' OR c.discipline = $3::case_discipline)
       AND ($4 = '' OR c.status = $4::case_status)
     ORDER BY c.created_at DESC`,
    [p.startDate ?? '', p.endDate ?? '', p.discipline ?? '', p.status ?? ''],
  );
}

// --- Alertas ----------------------------------------------------------------
export interface CaseAlertRow {
  _id: string;
  caseCode: string;
  title: string;
  deadlineDate?: string;
  commercialId: string | null;
  technicalAnalystId: string | null;
  assignedExpertId: string | null;
}

export async function casesNeedingHearing(): Promise<CaseAlertRow[]> {
  return query<CaseAlertRow>(
    `SELECT id AS "_id", case_code AS "caseCode", title,
       commercial_id AS "commercialId", technical_analyst_id AS "technicalAnalystId",
       assigned_expert_id AS "assignedExpertId"
     FROM cases WHERE has_hearing IS NOT TRUE AND status <> 'cancelado'`,
  );
}

export async function casesWithUrgentDeadline(today: string, threshold: string): Promise<CaseAlertRow[]> {
  return query<CaseAlertRow>(
    `SELECT id AS "_id", case_code AS "caseCode", title, deadline_date AS "deadlineDate",
       commercial_id AS "commercialId", technical_analyst_id AS "technicalAnalystId",
       assigned_expert_id AS "assignedExpertId"
     FROM cases
     WHERE deadline_date IS NOT NULL AND deadline_date <= $2::timestamptz
       AND deadline_date >= $1::timestamptz AND status <> 'cancelado'`,
    [today, threshold],
  );
}

export interface CaseDeadlineAlertRow extends CaseAlertRow {
  priority: string;
  deadlineDate?: string;
}

/**
 * Casos activos con deadline futuro; el umbral por urgencia lo aplica el cron
 * (RF-06: la ventana de recordatorio depende de `priority`).
 */
export async function casesWithUpcomingDeadline(today: string, maxThreshold: string): Promise<CaseDeadlineAlertRow[]> {
  return query<CaseDeadlineAlertRow>(
    `SELECT id AS "_id", case_code AS "caseCode", title, deadline_date AS "deadlineDate", priority,
       commercial_id AS "commercialId", technical_analyst_id AS "technicalAnalystId",
       assigned_expert_id AS "assignedExpertId"
     FROM cases
     WHERE deadline_date IS NOT NULL AND deadline_date <= $2::timestamptz
       AND deadline_date >= $1::timestamptz AND status NOT IN ('cancelado', 'archivado')`,
    [today, maxThreshold],
  );
}

export interface ExecutionDeadlineRow extends CaseAlertRow {
  executionDeadline: string;
  assignedFinancieroId: string | null;
}

/** Casos en ejecución (item 20) cuyo plazo de 15 días hábiles vence dentro de la ventana. */
export async function casesWithExecutionDeadlineSoon(threshold: string): Promise<ExecutionDeadlineRow[]> {
  return query<ExecutionDeadlineRow>(
    `SELECT id AS "_id", case_code AS "caseCode", title,
       execution_deadline AS "executionDeadline",
       commercial_id AS "commercialId", technical_analyst_id AS "technicalAnalystId",
       assigned_expert_id AS "assignedExpertId", assigned_financiero_id AS "assignedFinancieroId"
     FROM cases
     WHERE execution_deadline IS NOT NULL AND execution_deadline >= now()
       AND execution_deadline <= $1::timestamptz
       AND status NOT IN ('cancelado', 'archivado')`,
    [threshold],
  );
}

export interface RequiredDocsPendingRow {
  _id: string;
  caseCode: string;
  title: string;
  priority: string;
  commercialId: string | null;
  technicalAnalystId: string | null;
  pendingCount: number;
  pendingNames: string[];
}

/** Casos con documentos REQUERIDOS sin recibir (RF-05 + recordatorio documental, item 21). */
export async function casesWithRequiredDocsPending(): Promise<RequiredDocsPendingRow[]> {
  return query<RequiredDocsPendingRow>(
    `SELECT c.id AS "_id", c.case_code AS "caseCode", c.title, c.priority,
       c.commercial_id AS "commercialId", c.technical_analyst_id AS "technicalAnalystId",
       count(d.id)::int AS "pendingCount",
       array_agg(COALESCE(NULLIF(d.description, ''), d.category::text)) AS "pendingNames"
     FROM cases c
     JOIN case_document d ON d.case_id = c.id AND d.is_required = TRUE AND d.status <> 'recibido'
     WHERE c.status NOT IN ('cancelado', 'archivado')
     GROUP BY c.id`,
  );
}

// --- CRUD -------------------------------------------------------------------
export interface CaseInput {
  brand?: 'CNP' | 'Peritus';
  caseCode?: string | null;
  title: string;
  description?: string | null;
  clientId?: string | null;
  commercialId?: string | null;
  technicalAnalystId?: string | null;
  assignedExpertId?: string | null;
  assignedFinancieroId?: string | null;
  discipline?: Case['discipline'] | null;
  status?: Case['status'];
  statusChangedByRole?: string | null;
  complexity?: Case['complexity'];
  priority?: Case['priority'];
  channel?: Case['channel'] | null;
  commercialStatus?: Case['commercialStatus'];
  lossReason?: string | null;
  executionStartDate?: string | null;
  executionDeadline?: string | null;
  estimatedAmount?: number | null;
  hasHearing?: boolean;
  hearingDate?: string | null;
  hearingLink?: string | null;
  deadlineDate?: string | null;
  city?: string | null;
  courtName?: string | null;
  caseNumber?: string | null;
  riskScore?: number | null;
  createdById?: string | null;
}

function toColumns(input: Partial<CaseInput>): Record<string, unknown> {
  return pruneUndefined({
    brand: input.brand,
    case_code: input.caseCode,
    title: input.title,
    description: input.description,
    client_id: input.clientId,
    commercial_id: input.commercialId,
    technical_analyst_id: input.technicalAnalystId,
    assigned_expert_id: input.assignedExpertId,
    assigned_financiero_id: input.assignedFinancieroId,
    discipline: input.discipline,
    status: input.status,
    status_changed_by_role: input.statusChangedByRole,
    complexity: input.complexity,
    priority: input.priority,
    channel: input.channel,
    commercial_status: input.commercialStatus,
    loss_reason: input.lossReason,
    execution_start_date: input.executionStartDate,
    execution_deadline: input.executionDeadline,
    estimated_amount: input.estimatedAmount,
    has_hearing: input.hasHearing,
    hearing_date: input.hearingDate,
    hearing_link: input.hearingLink,
    deadline_date: input.deadlineDate,
    city: input.city,
    court_name: input.courtName,
    case_number: input.caseNumber,
    risk_score: input.riskScore,
    created_by_id: input.createdById,
  });
}

export async function createCase(input: CaseInput): Promise<CaseExpanded | null> {
  const id = newId();
  const { text, values } = buildInsert('cases', { id, ...toColumns(input) });
  await query(text, values);
  return getCaseById(id);
}

export async function updateCase(id: string, patch: Partial<CaseInput>): Promise<CaseExpanded | null> {
  const upd = buildUpdate('cases', id, toColumns(patch));
  if (upd) await query(upd.text, upd.values);
  return getCaseById(id);
}

export async function deleteCase(id: string): Promise<void> {
  await query('DELETE FROM cases WHERE id = $1', [id]);
}
