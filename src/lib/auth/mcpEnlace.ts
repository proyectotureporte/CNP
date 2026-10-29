/**
 * Enlace de edición del MCP (lógica pura, sin base de datos: se prueba aislada).
 *
 * El MCP de los CRM es de solo lectura. Cuando alguien quiere CAMBIAR algo de un cliente o caso de CNP, Claude entrega un enlace de
 * UN SOLO USO (vence en 5 minutos) a /acceso-mcp#t=<token>. El token viaja en el FRAGMENTO de la URL (el navegador nunca lo envía al
 * servidor), así que las vistas previas de WhatsApp/correo/Slack no pueden verlo ni gastarlo: solo un clic humano en «Continuar» lo canjea.
 * El canje abre la sesión del propio usuario de CNP de quien pidió el enlace (se enlaza por el correo de su acceso al MCP), con SUS permisos,
 * durante 30 minutos, y lo lleva a la ficha exacta. Los destinos son una lista cerrada.
 */
import { createHash } from 'node:crypto';
import type { UserRole } from '@/lib/types';

export const TOKEN_RE = /^mcpl_[A-Za-z0-9_-]{43}$/;
/** Solo la ficha de un cliente o de un caso: nunca una URL arbitraria. */
export const DESTINO_RE = /^\/crm\/(clients|cases)\/[A-Za-z0-9_-]{1,64}$/;
export const SESION_SEG = 30 * 60;

export const hashDeToken = (t: string): Buffer => createHash('sha256').update(t, 'utf8').digest();

/** Los clientes del portal y los peritos externos tienen sus propios accesos aislados: no entran por este enlace. */
export function rolPuedeUsarEnlace(role: UserRole | null | undefined): boolean {
  return !!role && role !== 'cliente' && role !== 'perito';
}

/** IP del visitante detrás de nginx: la que añade el proxy, nunca la que el cliente escribe primero. */
export function ipDe(headers: Pick<Headers, 'get'>): string {
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real;
  return headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || 'desconocida';
}

/** Limitador en memoria por IP (el token tiene 256 bits; esto solo frena el martilleo). */
export function crearLimitador(maxPorMinuto: number, ahora: () => number = Date.now) {
  const golpes = new Map<string, number[]>();
  return (ip: string): boolean => {
    const t = ahora();
    const lista = (golpes.get(ip) ?? []).filter((x) => t - x < 60_000);
    lista.push(t);
    golpes.set(ip, lista);
    if (golpes.size > 5000) for (const [k, v] of golpes) if (!v.some((x) => t - x < 60_000)) golpes.delete(k);
    return lista.length > maxPorMinuto;
  };
}

/** Solo desde nuestra propia página: nada de formularios de otros sitios. */
export function origenPermitido(origin: string | null, host: string | null): boolean {
  if (!origin) return true;
  try { return new URL(origin).host === host; } catch { return false; }
}
