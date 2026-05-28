import { query, queryOne, buildInsert, newId, nestedObj } from './pool';
import type { CaseEvent } from '@/lib/types';

const createdByObj = nestedObj('u', { _id: 'u.id', displayName: 'u.display_name' });

export async function listCaseEvents(caseId: string): Promise<CaseEvent[]> {
  return query<CaseEvent>(
    `SELECT e.id AS "_id", e.created_at AS "_createdAt", e.event_type AS "eventType",
       e.description, e.created_by_name AS "createdByName",
       ${createdByObj} AS "createdBy"
     FROM case_event e
     LEFT JOIN crm_user u ON u.id = e.created_by_id
     WHERE e.case_id = $1
     ORDER BY e.created_at DESC`,
    [caseId],
  );
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
  description?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  metadata?: string | null;
}

export async function createCaseEvent(input: CaseEventInput): Promise<string> {
  const id = newId();
  const { text, values } = buildInsert('case_event', {
    id,
    case_id: input.caseId,
    event_type: input.eventType,
    description: input.description ?? null,
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
