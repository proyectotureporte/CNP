import { caseEvent } from '@/lib/db';

interface LogEventParams {
  caseId: string;
  eventType: string;
  description: string;
  userId?: string | null;
  userName?: string | null;
}

/**
 * Registra un evento de caso. No bloqueante: si falla, no rompe la operación
 * principal. (Repuntado a PostgreSQL; el nombre de archivo se mantiene para no
 * tocar los imports de las rutas durante la Fase 5.)
 */
export async function logCaseEvent({ caseId, eventType, description, userId, userName }: LogEventParams) {
  await caseEvent.logCaseEvent({
    caseId,
    eventType,
    description,
    createdById: userId ?? null,
    createdByName: userName ?? 'Sistema',
  });
}
