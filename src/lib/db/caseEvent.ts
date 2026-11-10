import { query, queryOne, buildInsert, buildUpdate, newId, nestedObj, pruneUndefined } from './pool';
import { CLIENT_VISIBLE_EVENT_TYPES, type CaseEvent, type CaseEventType } from '@/lib/types';

const createdByObj = nestedObj('u', { _id: 'u.id', displayName: 'u.display_name' });
const documentObj = nestedObj('d', {
  _id: 'd.id', fileName: 'd.file_name', description: 'd.description', isVisibleToClient: 'd.is_visible_to_client',
});

const EVENT_SELECT = `SELECT e.id AS "_id", e.created_at AS "_createdAt", e.updated_at AS "_updatedAt",
       e.event_type AS "eventType", e.title,
       COALESCE(e.event_date, e.created_at) AS "eventDate",
       e.description, e.is_visible_to_client AS "isVisibleToClient",
       e.created_by_name AS "createdByName", u.role AS "createdByRole",
       ${createdByObj} AS "createdBy",
       ${documentObj} AS "document"
     FROM case_event e
     LEFT JOIN crm_user u ON u.id = e.created_by_id
     LEFT JOIN case_document d ON d.id = e.document_id`;

export async function listCaseEvents(caseId: string): Promise<CaseEvent[]> {
  return query<CaseEvent>(
    `${EVENT_SELECT}
     WHERE e.case_id = $1
     ORDER BY COALESCE(e.event_date, e.created_at) DESC, e.created_at DESC`,
    [caseId],
  );
}

/** Línea de tiempo del cliente: solo actuaciones marcadas visibles. */
export async function listClientVisibleEvents(caseId: string): Promise<CaseEvent[]> {
  return query<CaseEvent>(
    `${EVENT_SELECT}
     WHERE e.case_id = $1 AND e.is_visible_to_client = TRUE
     ORDER BY COALESCE(e.event_date, e.created_at) DESC, e.created_at DESC`,
    [caseId],
  );
}

export async function getCaseEventById(caseId: string, eventId: string): Promise<CaseEvent | null> {
  return queryOne<CaseEvent>(
    `${EVENT_SELECT}
     WHERE e.case_id = $1 AND e.id = $2`,
    [caseId, eventId],
  );
}

export interface CaseEventPatch {
  title?: string | null;
  description?: string;
  eventDate?: string;
  isVisibleToClient?: boolean;
  documentId?: string | null;
}

/**
 * Edición posterior de una actuación (descripción, título, fecha, visibilidad
 * para el cliente y documento de soporte). El trigger `set_updated_at` deja
 * constancia en `updated_at`.
 */
export async function updateCaseEvent(
  caseId: string,
  eventId: string,
  patch: CaseEventPatch,
): Promise<CaseEvent | null> {
  const data = pruneUndefined({
    title: patch.title,
    description: patch.description,
    event_date: patch.eventDate,
    is_visible_to_client: patch.isVisibleToClient,
    document_id: patch.documentId,
  });
  const upd = buildUpdate('case_event', eventId, data);
  if (upd) {
    await query(`${upd.text.replace(' RETURNING id', '')} AND case_id = $${upd.values.length + 1}`, [...upd.values, caseId]);
  }
  return getCaseEventById(caseId, eventId);
}

/** Compatibilidad con el nombre histórico. */
export async function updateCaseEventDescription(
  caseId: string,
  eventId: string,
  description: string,
): Promise<CaseEvent | null> {
  return updateCaseEvent(caseId, eventId, { description });
}

export async function countCaseEvents(caseId: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    'SELECT count(*)::int AS count FROM case_event WHERE case_id = $1',
    [caseId],
  );
  return row?.count ?? 0;
}

export interface CaseEventInput {
  caseId: string;
  eventType: string;
  title?: string | null;
  eventDate?: string | null;
  description?: string | null;
  /** Si se omite, se aplica la visibilidad por defecto según el tipo. */
  isVisibleToClient?: boolean;
  documentId?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  metadata?: string | null;
}

export function defaultEventVisibility(eventType: string): boolean {
  return CLIENT_VISIBLE_EVENT_TYPES.has(eventType as CaseEventType);
}

export async function createCaseEvent(input: CaseEventInput): Promise<string> {
  const id = newId();
  const { text, values } = buildInsert('case_event', {
    id,
    case_id: input.caseId,
    event_type: input.eventType,
    title: input.title ?? null,
    event_date: input.eventDate ?? new Date().toISOString(),
    description: input.description ?? null,
    is_visible_to_client: input.isVisibleToClient ?? defaultEventVisibility(input.eventType),
    document_id: input.documentId ?? null,
    created_by_id: input.createdById && input.createdById !== 'admin' ? input.createdById : null,
    created_by_name: input.createdByName ?? 'Sistema',
    metadata: input.metadata ?? null,
  });
  await query(text, values);
  return id;
}

/** Equivalente a logCaseEvent: registra un evento sin romper la operación principal. */
export async function logCaseEvent(input: CaseEventInput): Promise<void> {
  try {
    await createCaseEvent(input);
  } catch {
    // no bloqueante
  }
}
