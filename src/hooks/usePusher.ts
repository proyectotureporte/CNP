'use client';

import { useEffect, useRef } from 'react';
import { getPusherClient } from '@/lib/pusher/client';
import type { Channel } from 'pusher-js';

/**
 * Subscribe to one or more Pusher events on the 'crm' channel.
 * Calls `onEvent` whenever any of the listed events fires.
 */
export function usePusher(
  events: string | string[],
  onEvent: (eventName: string, data: Record<string, unknown>) => void
) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    const pusher = getPusherClient();
    const channel: Channel = pusher.subscribe('crm');

    const eventList = Array.isArray(events) ? events : [events];

    const handlers = eventList.map((evt) => {
      const handler = (data: Record<string, unknown>) => {
        callbackRef.current(evt, data);
      };
      channel.bind(evt, handler);
      return { evt, handler };
    });

    return () => {
      handlers.forEach(({ evt, handler }) => channel.unbind(evt, handler));
    };
  }, [Array.isArray(events) ? events.join(',') : events]); // eslint-disable-line react-hooks/exhaustive-deps
}
