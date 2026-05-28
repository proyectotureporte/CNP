import { query, queryOne, newId } from './pool';
import type { SystemSetting } from '@/lib/types';

const SELECT = `id AS "_id", key, value, data_type AS "dataType", description`;

export async function listSystemSettings(): Promise<SystemSetting[]> {
  return query<SystemSetting>(`SELECT ${SELECT} FROM system_setting ORDER BY key ASC`);
}

export async function getSystemSetting(key: string): Promise<SystemSetting | null> {
  return queryOne<SystemSetting>(`SELECT ${SELECT} FROM system_setting WHERE key = $1`, [key]);
}

export interface SystemSettingInput {
  key: string;
  value?: string | null;
  dataType?: string;
  description?: string | null;
}

/** Inserta o actualiza por `key` (clave única). */
export async function upsertSystemSetting(input: SystemSettingInput): Promise<SystemSetting | null> {
  await query(
    `INSERT INTO system_setting (id, key, value, data_type, description)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, data_type = EXCLUDED.data_type, description = EXCLUDED.description`,
    [newId(), input.key, input.value ?? null, input.dataType ?? 'string', input.description ?? null],
  );
  return getSystemSetting(input.key);
}

export async function deleteSystemSetting(key: string): Promise<void> {
  await query('DELETE FROM system_setting WHERE key = $1', [key]);
}
