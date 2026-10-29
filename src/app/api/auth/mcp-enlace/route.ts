import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth/jwt';
import { hasAllRolesAccess } from '@/lib/auth/allRoles';
import { DESTINO_RE, SESION_SEG, TOKEN_RE, crearLimitador, hashDeToken, ipDe, origenPermitido, rolPuedeUsarEnlace } from '@/lib/auth/mcpEnlace';
import * as crmUser from '@/lib/db/crmUser';
import { createAuditLog } from '@/lib/db/auditLog';
import { canjearEnlace, verEnlace } from '@/lib/db/mcpEnlace';
import { normalizeUserRole } from '@/lib/types';

// Canje del enlace de edición que entrega el MCP. Público a propósito (quien llega aún no tiene sesión; `/api/auth/*` está exento del
// middleware): la seguridad está en el token de un solo uso (5 min, solo existe su huella en la base del MCP). Ver lib/auth/mcpEnlace.ts.
const NO_CACHE = { 'Cache-Control': 'no-store' };
const limitado = crearLimitador(20);
const INVALIDO = () => NextResponse.json({ error: 'Este enlace ya se usó o venció. Pide uno nuevo en el chat.' }, { status: 404, headers: NO_CACHE });
const falla = (error: string, status: number) => NextResponse.json({ error }, { status, headers: NO_CACHE });

export async function POST(request: NextRequest) {
  if (!origenPermitido(request.headers.get('origin'), request.headers.get('host'))) return falla('Origen no permitido', 403);
  const ip = ipDe(request.headers);
  if (limitado(ip)) return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429, headers: { ...NO_CACHE, 'Retry-After': '60' } });

  const b = (await request.json().catch(() => null)) as { t?: unknown; paso?: unknown } | null;
  if (typeof b?.t !== 'string' || !TOKEN_RE.test(b.t) || (b.paso !== 'ver' && b.paso !== 'canjear')) return INVALIDO();
  const hash = hashDeToken(b.t);

  try {
    if (b.paso === 'ver') {
      const v = await verEnlace(hash);
      if (v === 'sin_configurar') return falla('El enlace de edición no está configurado en este servidor.', 503);
      if (!v) return INVALIDO();
      return NextResponse.json({ nombre: v.owner, etiqueta: v.etiqueta }, { headers: NO_CACHE });
    }

    const c = await canjearEnlace(hash, ip, request.headers.get('user-agent') ?? '');
    if (c === 'sin_configurar') return falla('El enlace de edición no está configurado en este servidor.', 503);
    if (!c) return INVALIDO();
    // Defensa extra: el destino solo puede ser la ficha de un cliente o caso.
    if (!DESTINO_RE.test(c.destino)) return INVALIDO();

    // La sesión es la del usuario de CNP de quien pidió el enlace, con SUS permisos (no una sesión genérica ni de administrador).
    if (!c.email) return falla('Tu acceso al MCP no tiene un correo asociado, así que no se sabe con qué usuario de CNP entrar. Pide al administrador que te cree el acceso desde el panel.', 403);
    const user = await crmUser.getUserByEmail(c.email);
    const role = user ? normalizeUserRole(user.role as string) : null;
    if (!user || !role) return falla(`El correo ${c.email} no tiene un usuario activo en el CRM de CNP.`, 403);
    if (!rolPuedeUsarEnlace(role)) return falla('Tu cuenta de CNP no entra por el CRM interno: usa tu portal habitual.', 403);

    const token = await signToken(
      { sub: user._id, role, displayName: user.displayName, allRoles: hasAllRolesAccess(user.email, role) },
      `${SESION_SEG}s`,
    );
    await createAuditLog({
      userId: user._id,
      action: 'mcp_enlace_edicion',
      entityType: 'crm_ficha',
      entityId: c.destino,
      newValues: JSON.stringify({ accion: c.accion, pidio: c.owner }),
      ipAddress: ip,
    }).catch(() => undefined);

    const res = NextResponse.json({ destino: c.destino }, { headers: NO_CACHE });
    res.cookies.set('crm-token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESION_SEG });
    // Una sola identidad por navegador: si había una sesión de administración con contraseña maestra, se cierra.
    res.cookies.set('admin-token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
    return res;
  } catch (err) {
    console.error('[mcp-enlace] error:', (err as Error).message);
    return falla('No se pudo abrir el enlace. Intenta de nuevo.', 500);
  }
}
