import { Pool, types, type PoolClient } from 'pg';

// ----------------------------------------------------------------------------
// Parsers de tipos: mantener el contrato que tenía Sanity.
//   * NUMERIC (1700) y BIGINT/int8 (20) → number de JS (no string).
//   * timestamptz (1184) y timestamp (1114) → ISO string (como los _createdAt
//     de Sanity), no objeto Date.
// ----------------------------------------------------------------------------
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));
types.setTypeParser(1184, (v) => (v === null ? null : new Date(v).toISOString()));
types.setTypeParser(1114, (v) => (v === null ? null : new Date(v + 'Z').toISOString()));

// ----------------------------------------------------------------------------
// Pool singleton (sobrevive a HMR en desarrollo)
// ----------------------------------------------------------------------------
const globalForPg = globalThis as unknown as { __cnpPgPool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada');
  }
  return new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export const pool: Pool = globalForPg.__cnpPgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalForPg.__cnpPgPool = pool;

// ----------------------------------------------------------------------------
// Helpers de consulta
// ----------------------------------------------------------------------------
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool.query(text, params as unknown[]);
  return res.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Ejecuta `fn` dentro de una transacción (BEGIN/COMMIT, ROLLBACK ante error). */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ----------------------------------------------------------------------------
// Utilidades
// ----------------------------------------------------------------------------

/** Genera un id nuevo (UUID v4) para filas creadas desde la app. */
export function newId(): string {
  return crypto.randomUUID();
}

/** Quita las claves cuyo valor es `undefined` (no afecta a `null`). */
export function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

/**
 * Construye un INSERT parametrizado. `data` usa nombres de columna snake_case.
 * Devuelve `{ text, values }` con `RETURNING id`.
 */
export function buildInsert(table: string, data: Record<string, unknown>): { text: string; values: unknown[] } {
  const cols = Object.keys(data);
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  const text = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;
  return { text, values: cols.map((c) => data[c]) };
}

/**
 * Construye un UPDATE parametrizado por id. `data` usa columnas snake_case.
 * Devuelve `null` si no hay columnas que actualizar.
 */
export function buildUpdate(
  table: string,
  id: string,
  data: Record<string, unknown>,
): { text: string; values: unknown[] } | null {
  const cols = Object.keys(data);
  if (cols.length === 0) return null;
  const sets = cols.map((c, i) => `${c} = $${i + 1}`);
  const text = `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${cols.length + 1} RETURNING id`;
  return { text, values: [...cols.map((c) => data[c]), id] };
}

/**
 * Genera un fragmento SQL que arma un objeto JSON anidado (estilo `ref->{...}`
 * de GROQ) y devuelve NULL cuando la fila referida no existe.
 *   nestedObj('cu', { _id: 'cu.id', displayName: 'cu.display_name' })
 *     → CASE WHEN cu.id IS NULL THEN NULL ELSE json_build_object('_id', cu.id, ...) END
 */
export function nestedObj(alias: string, fields: Record<string, string>): string {
  const pairs = Object.entries(fields)
    .map(([k, expr]) => `'${k}', ${expr}`)
    .join(', ');
  return `CASE WHEN ${alias}.id IS NULL THEN NULL ELSE json_build_object(${pairs}) END`;
}
