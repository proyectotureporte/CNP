'use client';

// Cliente WebSocket nativo con reconexión automática (reemplaza pusher-js).
// Mantiene una sola conexión a /ws compartida por todas las suscripciones.

type EventHandler = (eventName: string, data: Record<string, unknown>) => void;

interface Subscription {
  events: Set<string>;
  handler: EventHandler;
}

class RealtimeClient {
  private ws: WebSocket | null = null;
  private subs = new Set<Subscription>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private closedByUs = false;

  /** Suscribe a una lista de eventos. Devuelve la función de baja. */
  subscribe(events: string[], handler: EventHandler): () => void {
    const sub: Subscription = { events: new Set(events), handler };
    this.subs.add(sub);
    this.ensureConnection();

    return () => {
      this.subs.delete(sub);
      if (this.subs.size === 0) this.disconnect();
    };
  }

  private ensureConnection(): void {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.connect();
  }

  private connect(): void {
    if (typeof window === 'undefined') return;
    this.closedByUs = false;

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${window.location.host}/ws`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectDelay = 1000;
    };

    ws.onmessage = (ev: MessageEvent) => {
      let msg: { channel?: string; event?: string; data?: Record<string, unknown> };
      try {
        msg = JSON.parse(ev.data as string);
      } catch {
        return;
      }
      if (!msg?.event || msg.channel === 'system') return;
      for (const sub of this.subs) {
        if (sub.events.has(msg.event)) sub.handler(msg.event, msg.data || {});
      }
    };

    ws.onclose = () => {
      this.ws = null;
      if (!this.closedByUs && this.subs.size > 0) this.scheduleReconnect();
    };

    ws.onerror = () => {
      try {
        ws.close();
      } catch {
        // noop
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = this.reconnectDelay;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.subs.size > 0) this.connect();
    }, delay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
  }

  private disconnect(): void {
    this.closedByUs = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // noop
      }
      this.ws = null;
    }
  }
}

export const realtimeClient = new RealtimeClient();
