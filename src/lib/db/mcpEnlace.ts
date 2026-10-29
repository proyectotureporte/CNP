/**
 * Conexión al almacén de enlaces del MCP (base `mcp_gateway`) con el rol `mcp_panel_cnp`, que SOLO puede ejecutar dos funciones:
 * ver (sin consumir) y canjear un enlace. No lee tablas, no crea enlaces ni tokens. Variable: MCP_ENLACE_DATABASE_URL.
 */
import { Pool } from 'pg';

const g = globalThis as unknown as { __cnpMcpEnlacePool?: Pool };

function pool(): Pool | null {
  const url = process.env.MCP_ENLACE_DATABASE_URL;
  if (!url) return null;
  g.__cnpMcpEnlacePool ??= new Pool({ connectionString: url, max: 2, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 4000 });
  return g.__cnpMcpEnlacePool;
}

export interface EnlaceVista { owner: string; etiqueta: string }
export interface EnlaceCanje { owner: string; destino: string; accion: string; etiqueta: string; email: string | null }

export async function verEnlace(hash: Buffer): Promise<EnlaceVista | null | 'sin_configurar'> {
  const p = pool();
  if (!p) return 'sin_configurar';
  const r = await p.query<EnlaceVista>('SELECT owner, etiqueta FROM mcp_magic_peek($1)', [hash]);
  return r.rows[0] ?? null;
}

/** Atómico y de un solo uso: la segunda llamada con el mismo token devuelve null. */
export async function canjearEnlace(hash: Buffer, ip: string, ua: string): Promise<EnlaceCanje | null | 'sin_configurar'> {
  const p = pool();
  if (!p) return 'sin_configurar';
  const r = await p.query<EnlaceCanje>('SELECT owner, destino, accion, etiqueta, email FROM mcp_magic_redeem($1, $2, $3)', [hash, ip.slice(0, 80), ua.slice(0, 300)]);
  return r.rows[0] ?? null;
}
