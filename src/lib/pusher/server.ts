import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export type PusherEvent =
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

export function triggerEvent(event: PusherEvent, data?: Record<string, unknown>) {
  pusher.trigger('crm', event, { ...data, _ts: Date.now() }).catch((err) => {
    console.error(`[pusher] Error triggering ${event}:`, err);
  });
}

export default pusher;
