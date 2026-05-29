'use client';

import { useEffect, useRef } from 'react';
import { realtimeClient } from '@/lib/realtime/client';

/**
 * Suscribe a uno o más eventos de tiempo real (canal 'crm').
 * Llama a `onEvent` cada vez que se dispara alguno de los eventos listados.
 *
 * (Reimplementado sobre WebSockets nativos; el nombre se mantiene para no
 * tocar los componentes que ya lo consumen.)
 */
export function usePusher(
  events: string | string[],
  onEvent: (eventName: string, data: Record<string, unknown>) => void
) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  const key = Array.isArray(events) ? events.join(',') : events;

  useEffect(() => {
    const eventList = Array.isArray(events) ? events : [events];
    const unsubscribe = realtimeClient.subscribe(eventList, (evt, data) => {
      callbackRef.current(evt, data);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
