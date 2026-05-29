// Broadcast de eventos en tiempo real por WebSockets nativos (reemplaza Pusher).
//
// El servidor custom (server.js) registra las conexiones en
// globalThis.__cnpRealtimeHub. Como las route handlers corren en el MISMO
// proceso, triggerEvent() accede a ese hub vía globalThis y emite a todos los
// clientes conectados. Si el hub no existe (build, o `next dev` sin server.js),
// triggerEvent es un no-op seguro.

export type RealtimeEvent =
  | 'case:created' | 'case:updated' | 'case:status-changed' | 'case:assigned'
  | 'quote:created' | 'quote:updated' | 'quote:approved' | 'quote:rejected' | 'quote:sent'
  | 'activity:created' | 'activity:updated' | 'activity:deleted'
  | 'work-plan:submitted' | 'work-plan:approved' | 'work-plan:rejected'
  | 'deliverable:created' | 'deliverable:reviewed'
  | 'payment:updated' | 'payment:receipt'
  | 'notification:new' | 'notification:read'
  | 'client:created' | 'client:updated' | 'client:deleted'
  | 'expert:created' | 'expert:updated'
  | 'document:created' | 'document:deleted'
  | 'hearing:created' | 'hearing:updated'
  | 'evaluation:created'
  | 'commission:calculated'
  | 'whatsapp:message' | 'whatsapp:lead'
  | 'user:created' | 'user:updated';

interface RealtimeClient {
  readyState: number;
  send: (data: string) => void;
}

interface RealtimeHub {
  clients: Set<RealtimeClient>;
}

const globalForRealtime = globalThis as unknown as { __cnpRealtimeHub?: RealtimeHub };

const WS_OPEN = 1;

export function triggerEvent(event: RealtimeEvent, data?: Record<string, unknown>): void {
  const hub = globalForRealtime.__cnpRealtimeHub;
  if (!hub || hub.clients.size === 0) return;

  const message = JSON.stringify({
    channel: 'crm',
    event,
    data: { ...data, _ts: Date.now() },
  });

  for (const client of hub.clients) {
    try {
      if (client.readyState === WS_OPEN) client.send(message);
    } catch {
      // ignorar sockets caídos; el servidor los limpia en 'close'
    }
  }
}
