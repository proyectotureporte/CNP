import { auditLog } from '@/lib/db';

// Auditoría de cambios (item 19): usuario, fecha, campo cambiado, valor
// anterior y valor nuevo. Se invoca desde las rutas de edición; nunca rompe
// la operación principal.

const IGNORED_KEYS = new Set(['_updatedAt', 'updatedAt', '_createdAt', 'createdAt', 'passwordHash']);

function serialize(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Diff campo a campo entre dos snapshots. Devuelve null si no hay cambios. */
export function diffValues(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): { oldValues: Record<string, unknown>; newValues: Record<string, unknown> } | null {
  const oldValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (IGNORED_KEYS.has(key)) continue;
    if (serialize(before[key]) !== serialize(after[key])) {
      oldValues[key] = before[key] ?? null;
      newValues[key] = after[key] ?? null;
    }
  }
  return Object.keys(newValues).length === 0 ? null : { oldValues, newValues };
}

export function ipFromRequest(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : null;
}

export interface AuditChangeInput {
  request: Request;
  action: 'create' | 'update' | 'delete' | string;
  entityType: string;
  entityId: string;
  /** Snapshot previo (update/delete). */
  before?: Record<string, unknown> | null;
  /** Snapshot posterior (create/update). */
  after?: Record<string, unknown> | null;
}

/** Registra la edición en audit_log con diff campo a campo. No bloqueante. */
export async function auditEntityChange(input: AuditChangeInput): Promise<void> {
  try {
    const userId = input.request.headers.get('x-user-id');
    let oldValues: string | null = null;
    let newValues: string | null = null;

    if (input.action === 'update' && input.before && input.after) {
      const diff = diffValues(input.before, input.after);
      if (!diff) return; // sin cambios reales: no ensuciar la auditoría
      oldValues = JSON.stringify(diff.oldValues);
      newValues = JSON.stringify(diff.newValues);
    } else {
      if (input.before) oldValues = JSON.stringify(input.before);
      if (input.after) newValues = JSON.stringify(input.after);
    }

    await auditLog.createAuditLog({
      userId,
      action: `${input.action}:${input.entityType}`,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValues,
      newValues,
      ipAddress: ipFromRequest(input.request),
    });
  } catch (err) {
    console.error('[audit] Error registrando auditoría:', err);
  }
}
