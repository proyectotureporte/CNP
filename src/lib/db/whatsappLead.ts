import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type { WhatsappLead, LeadStatus } from '@/lib/types';

const convertedClientObj = nestedObj('cc', { _id: 'cc.id', name: 'cc.name', email: 'cc.email' });

const documentsAgg = `
  COALESCE((
    SELECT json_agg(json_build_object('fileName', d.file_name, 'mimeType', d.mime_type, 'fileUrl', d.file_url) ORDER BY d.sort_order)
    FROM whatsapp_lead_document d WHERE d.lead_id = l.id
  ), '[]'::json) AS "documents"
`;

const lastMessageObj = `
  (SELECT json_build_object('content', m.content, 'direction', m.direction, 'sender', m.sender, 'timestamp', m.ts)
   FROM whatsapp_message m WHERE m.lead_id = l.id ORDER BY m.ts DESC LIMIT 1) AS "lastMessage"
`;

const BASE = `
  l.id AS "_id", l.created_at AS "_createdAt", l.updated_at AS "_updatedAt",
  l.phone, l.name, l.city, l.motive, l.brand, l.status,
  l.ai_completed AS "aiCompleted", l.ai_summary AS "aiSummary", l.notes,
  l.last_message_at AS "lastMessageAt", l.unread_count AS "unreadCount",
  ${convertedClientObj} AS "convertedClient"
`;

export async function listWhatsappLeads(brand = '', status = '', search = ''): Promise<WhatsappLead[]> {
  return query<WhatsappLead>(
    `SELECT ${BASE}, ${documentsAgg}, ${lastMessageObj}
     FROM whatsapp_lead l LEFT JOIN crm_client cc ON cc.id = l.converted_client_id
     WHERE ($1 = '' OR l.brand = $1::brand)
       AND ($2 = '' OR l.status = $2::lead_status)
       AND ($3 = '' OR l.name ILIKE $3 || '%' OR l.phone ILIKE $3 || '%' OR l.city ILIKE $3 || '%')
     ORDER BY l.last_message_at DESC NULLS LAST`,
    [brand, status, search],
  );
}

export async function getWhatsappLeadById(id: string): Promise<WhatsappLead | null> {
  return queryOne<WhatsappLead>(
    `SELECT ${BASE}, ${documentsAgg}
     FROM whatsapp_lead l LEFT JOIN crm_client cc ON cc.id = l.converted_client_id
     WHERE l.id = $1`,
    [id],
  );
}

/** Lead activo (no descartado) más reciente para un teléfono. */
export async function getWhatsappLeadByPhone(phone: string): Promise<{ _id: string; status: LeadStatus } | null> {
  return queryOne<{ _id: string; status: LeadStatus }>(
    `SELECT id AS "_id", status FROM whatsapp_lead
     WHERE phone = $1 AND status <> 'descartado' ORDER BY created_at DESC LIMIT 1`,
    [phone],
  );
}

export async function countWhatsappLeadsByBrand(): Promise<{ cnp: number; peritus: number; descartados: number }> {
  const row = await queryOne<{ cnp: number; peritus: number; descartados: number }>(
    `SELECT
       count(*) FILTER (WHERE brand = 'CNP' AND status <> 'descartado')::int AS cnp,
       count(*) FILTER (WHERE brand = 'Peritus' AND status <> 'descartado')::int AS peritus,
       count(*) FILTER (WHERE status = 'descartado')::int AS descartados
     FROM whatsapp_lead`,
  );
  return row ?? { cnp: 0, peritus: 0, descartados: 0 };
}

export interface WhatsappLeadInput {
  phone?: string | null;
  name?: string | null;
  city?: string | null;
  motive?: string | null;
  brand?: 'CNP' | 'Peritus';
  status?: LeadStatus;
  aiCompleted?: boolean;
  aiSummary?: string | null;
  notes?: string | null;
  convertedClientId?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
}

function toColumns(input: Partial<WhatsappLeadInput>): Record<string, unknown> {
  return pruneUndefined({
    phone: input.phone,
    name: input.name,
    city: input.city,
    motive: input.motive,
    brand: input.brand,
    status: input.status,
    ai_completed: input.aiCompleted,
    ai_summary: input.aiSummary,
    notes: input.notes,
    converted_client_id: input.convertedClientId,
    last_message_at: input.lastMessageAt,
    unread_count: input.unreadCount,
  });
}

export async function createWhatsappLead(input: WhatsappLeadInput): Promise<string> {
  const id = newId();
  const { text, values } = buildInsert('whatsapp_lead', {
    id,
    phone: input.phone ?? '',
    name: input.name ?? '',
    city: input.city ?? '',
    motive: input.motive ?? '',
    brand: input.brand ?? 'Peritus',
    status: input.status ?? 'nuevo',
    ai_completed: input.aiCompleted ?? false,
    ai_summary: input.aiSummary ?? null,
    notes: input.notes ?? null,
    converted_client_id: input.convertedClientId ?? null,
    last_message_at: input.lastMessageAt ?? new Date().toISOString(),
    unread_count: input.unreadCount ?? 0,
  });
  await query(text, values);
  return id;
}

/** Devuelve el id del lead activo para `phone`, creándolo si no existe. */
export async function findOrCreateLeadByPhone(phone: string): Promise<string> {
  const existing = await getWhatsappLeadByPhone(phone);
  if (existing) return existing._id;
  return createWhatsappLead({ phone });
}

export async function updateWhatsappLead(id: string, patch: Partial<WhatsappLeadInput>): Promise<WhatsappLead | null> {
  const upd = buildUpdate('whatsapp_lead', id, toColumns(patch));
  if (upd) await query(upd.text, upd.values);
  return getWhatsappLeadById(id);
}

export async function touchLeadIncomingMessage(id: string): Promise<void> {
  await query(
    `UPDATE whatsapp_lead SET last_message_at = now(), unread_count = unread_count + 1, status = 'en_conversacion' WHERE id = $1`,
    [id],
  );
}

export async function setLeadLastMessageNow(id: string): Promise<void> {
  await query('UPDATE whatsapp_lead SET last_message_at = now() WHERE id = $1', [id]);
}

export async function markLeadRead(id: string): Promise<void> {
  await query('UPDATE whatsapp_lead SET unread_count = 0 WHERE id = $1', [id]);
}

export interface WhatsappLeadDocInput {
  leadId: string;
  fileUrl?: string | null;
  fileAssetId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  sortOrder?: number;
}

export async function addLeadDocument(input: WhatsappLeadDocInput): Promise<string> {
  const id = newId();
  const { text, values } = buildInsert('whatsapp_lead_document', {
    id,
    lead_id: input.leadId,
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
