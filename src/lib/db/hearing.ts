import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type { Hearing, HearingResult } from '@/lib/types';

const caseObj = nestedObj('c', { _id: 'c.id', caseCode: 'c.case_code', title: 'c.title' });

const SELECT = `
  h.id AS "_id", h.created_at AS "_createdAt", h.scheduled_date AS "scheduledDate",
  h.location, h.court_name AS "courtName", h.judge_name AS "judgeName",
  h.expert_attended AS "expertAttended", h.client_attended AS "clientAttended",
  h.duration_minutes AS "durationMinutes", h.result, h.notes,
  h.follow_up_required AS "followUpRequired"
`;

export async function listCaseHearings(caseId: string): Promise<Hearing[]> {
  return query<Hearing>(
    `SELECT ${SELECT} FROM hearing h WHERE h.case_id = $1 ORDER BY h.scheduled_date DESC`,
    [caseId],
  );
}

export async function getHearingById(id: string): Promise<Hearing | null> {
  return queryOne<Hearing>(
    `SELECT ${SELECT}, ${caseObj} AS "case"
     FROM hearing h LEFT JOIN cases c ON c.id = h.case_id WHERE h.id = $1`,
    [id],
  );
}

export interface HearingInput {
  caseId: string;
  scheduledDate?: string | null;
  location?: string | null;
  courtName?: string | null;
  judgeName?: string | null;
  expertAttended?: boolean;
  clientAttended?: boolean;
  durationMinutes?: number | null;
  result?: HearingResult;
  notes?: string | null;
  followUpRequired?: boolean;
}

function toColumns(input: Partial<HearingInput>): Record<string, unknown> {
  return pruneUndefined({
    case_id: input.caseId,
    scheduled_date: input.scheduledDate,
    location: input.location,
    court_name: input.courtName,
    judge_name: input.judgeName,
    expert_attended: input.expertAttended,
    client_attended: input.clientAttended,
    duration_minutes: input.durationMinutes,
    result: input.result,
    notes: input.notes,
    follow_up_required: input.followUpRequired,
  });
}

export async function createHearing(input: HearingInput): Promise<Hearing | null> {
  const id = newId();
  const { text, values } = buildInsert('hearing', { id, ...toColumns(input) });
  await query(text, values);
  return getHearingById(id);
}

export async function updateHearing(id: string, patch: Partial<HearingInput>): Promise<Hearing | null> {
  const upd = buildUpdate('hearing', id, toColumns(patch));
  if (upd) await query(upd.text, upd.values);
  return getHearingById(id);
}

export async function deleteHearing(id: string): Promise<void> {
  await query('DELETE FROM hearing WHERE id = $1', [id]);
}
