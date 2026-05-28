import { query, queryOne, newId } from './pool';
import type { AdminConfig } from '@/lib/types';

const SELECT = `
  id AS "_id", 'adminConfig' AS "_type", created_at AS "_createdAt", updated_at AS "_updatedAt",
  master_password_hash AS "masterPasswordHash", secondary_password_hash AS "secondaryPasswordHash"
`;

/** Config singleton del admin (la primera fila). */
export async function getAdminConfig(): Promise<AdminConfig | null> {
  return queryOne<AdminConfig>(`SELECT ${SELECT} FROM admin_config ORDER BY created_at ASC LIMIT 1`);
}

export interface AdminConfigInput {
  masterPasswordHash?: string | null;
  secondaryPasswordHash?: string | null;
}

/** Crea la config si no existe, o actualiza los hashes provistos. */
export async function upsertAdminConfig(input: AdminConfigInput): Promise<AdminConfig | null> {
  const existing = await getAdminConfig();
  if (!existing) {
    await query(
      `INSERT INTO admin_config (id, master_password_hash, secondary_password_hash) VALUES ($1, $2, $3)`,
      [newId(), input.masterPasswordHash ?? null, input.secondaryPasswordHash ?? null],
    );
  } else {
    await query(
      `UPDATE admin_config
       SET master_password_hash = COALESCE($1, master_password_hash),
           secondary_password_hash = COALESCE($2, secondary_password_hash)
       WHERE id = $3`,
      [input.masterPasswordHash ?? null, input.secondaryPasswordHash ?? null, existing._id],
    );
  }
  return getAdminConfig();
}
