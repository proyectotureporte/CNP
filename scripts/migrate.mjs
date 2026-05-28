// Runner de migraciones SQL. Aplica db/migrations/*.sql en orden lexicográfico,
// registrando cada archivo aplicado en la tabla schema_migrations (idempotente).
//   Uso:  node scripts/migrate.mjs
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

// ── Cargar .env.local (mismo formato que el resto de scripts) ──
if (existsSync('.env.local')) {
  const envContent = readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL no está configurada (en .env.local o en el entorno).');
  process.exit(1);
}

const migrationsDir = join(process.cwd(), 'db', 'migrations');

async function main() {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const applied = new Set(
      (await client.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename),
    );

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`· ${file} (ya aplicada)`);
        continue;
      }
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');
      console.log(`▶ aplicando ${file} ...`);
      // El propio archivo abre/cierra su transacción (BEGIN/COMMIT).
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      console.log(`✔ ${file} aplicada`);
      count++;
    }
    console.log(count === 0 ? 'Sin migraciones pendientes.' : `${count} migración(es) aplicada(s).`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Falló la migración:', err.message);
  process.exit(1);
});
