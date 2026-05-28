import { query, queryOne, buildInsert, newId, nestedObj } from './pool';
import type { AuditLog } from '@/lib/types';

const userObj = nestedObj('u', { _id: 'u.id', displayName: 'u.display_name' });

export async function listAuditLogs(limit = 50, offset = 0): Promise<AuditLog[]> {
  return query<AuditLog>(
    `SELECT a.id AS "_id", a.created_at AS "_createdAt", a.action, a.entity_type AS "entityType",
       a.entity_id AS "entityId", a.old_values AS "oldValues", a.new_values AS "newValues",
       a.ip_address AS "ipAddress", ${userObj} AS "user"
     FROM audit_log a LEFT JOIN crm_user u ON u.id = a.user_id
     ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
}

export async function countAuditLogs(): Promise<number> {
  const row = await queryOne<{ count: number }>('SELECT count(*)::int AS count FROM audit_log');
  return row?.count ?? 0;
}

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  oldValues?: string | null;
  newValues?: string | null;
  ipAddress?: string | null;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  const id = newId();
  const { text, values } = buildInsert('audit_log', {
    id,
    user_id: input.userId && input.userId !== 'admin' ? input.userId : null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    old_values: input.oldValues ?? null,
    new_values: input.newValues ?? null,
    ip_address: input.ipAddress ?? null,
  });
  await query(text, values);
}
