import { query, buildInsert, newId } from './pool';
import type { WhatsappMessage } from '@/lib/types';

export async function listWhatsappMessages(leadId: string): Promise<WhatsappMessage[]> {
  return query<WhatsappMessage>(
    `SELECT id AS "_id", created_at AS "_createdAt", direction, content, sender,
       agent_name AS "agentName", ts AS "timestamp",
       media_url AS "mediaUrl", media_type AS "mediaType", file_name AS "fileName"
     FROM whatsapp_message WHERE lead_id = $1 ORDER BY ts ASC`,
    [leadId],
  );
}

export interface WhatsappMessageInput {
  leadId: string;
  direction?: 'incoming' | 'outgoing';
  content?: string | null;
  sender?: 'client' | 'ai' | 'agent';
  agentName?: string | null;
  timestamp?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  fileName?: string | null;
}

export async function createWhatsappMessage(input: WhatsappMessageInput): Promise<string> {
  const id = newId();
  const { text, values } = buildInsert('whatsapp_message', {
    id,
    lead_id: input.leadId,
    direction: input.direction ?? null,
    content: input.content ?? null,
    sender: input.sender ?? null,
    agent_name: input.agentName ?? null,
    ts: input.timestamp ?? new Date().toISOString(),
    media_url: input.mediaUrl ?? null,
    media_type: input.mediaType ?? null,
    file_name: input.fileName ?? null,
  });
  await query(text, values);
  return id;
}
