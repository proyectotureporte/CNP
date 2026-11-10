import { caseEvent } from '@/lib/db';

interface LogEventParams {
  caseId: string;
  eventType: string;
  description: string;
  title?: string | null;
  eventDate?: string | null;
  /** Si se omite se aplica la visibilidad por defecto del tipo de evento. */
  isVisibleToClient?: boolean;
  documentId?: string | null;
  userId?: string | null;
  userName?: string | null;
}

/**
 * Registra un evento de caso. No bloqueante: si falla, no rompe la operación
 * principal. (Repuntado a PostgreSQL; el nombre de archivo se mantiene para no
 * tocar los imports de las rutas durante la Fase 5.)
 */
export async function logCaseEvent({
  caseId, eventType, description, title, eventDate, isVisibleToClient, documentId, userId, userName,
}: LogEventParams) {
  await caseEvent.logCaseEvent({
    caseId,
    eventType,
    description,
    title: title ?? null,
    eventDate: eventDate ?? null,
    isVisibleToClient,
    documentId: documentId ?? null,
    createdById: userId ?? null,
    createdByName: userName ?? 'Sistema',
  });
}
