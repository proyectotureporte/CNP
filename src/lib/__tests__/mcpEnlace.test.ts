/**
 * Enlace de edición del MCP en CNP: lógica pura + barrera de regresión estática del endpoint público.
 * Ejecutar: npx tsx src/lib/__tests__/mcpEnlace.test.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DESTINO_RE, SESION_SEG, TOKEN_RE, crearLimitador, hashDeToken, ipDe, origenPermitido, rolPuedeUsarEnlace } from '../auth/mcpEnlace';

let passed = 0;
let failed = 0;
function assert(condition: boolean, message: string) {
  if (condition) { passed++; console.log(`PASS: ${message}`); } else { failed++; console.error(`FAIL: ${message}`); }
}
const ROOT = join(__dirname, '..', '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

// --- destinos: lista cerrada ---
for (const ok of ['/crm/clients/340c540b-f2c3-4d51-9e72-f4e8263d12fc', '/crm/cases/40L5ChlweOHtktuIUHVdfi', '/crm/clients/cl1']) assert(DESTINO_RE.test(ok), `destino permitido: ${ok}`);
for (const mal of ['/crm', '/crm/clients', '/crm/clients/a/edit', '/crm/clients/a?x=1', '/crm/clients/a#x', '/admin/users', '/crm/settings', '//evil.example/crm/clients/a',
  'https://evil.example/crm/clients/a', '/crm/clients/../admin', '/crm/clients/a b', '/crm/clients/' + 'a'.repeat(65), '/crm/payments/a', '/portal/cases/a']) {
  assert(!DESTINO_RE.test(mal), `destino rechazado: ${mal}`);
}
// --- token ---
assert(TOKEN_RE.test('mcpl_' + 'A'.repeat(43)) && !TOKEN_RE.test('mcpl_' + 'A'.repeat(42)) && !TOKEN_RE.test('mcpi_' + 'A'.repeat(43)) && !TOKEN_RE.test('mcpl_' + 'A'.repeat(43) + '\n'), 'formato del token');
assert(hashDeToken('x').length === 32 && hashDeToken('x').equals(hashDeToken('x')) && !hashDeToken('x').equals(hashDeToken('y')), 'huella SHA-256 de 32 bytes');
// --- roles ---
assert(rolPuedeUsarEnlace('admin') && rolPuedeUsarEnlace('comercial_juridico') && rolPuedeUsarEnlace('junta') && rolPuedeUsarEnlace('perito_interno'), 'el personal interno puede usar el enlace');
assert(!rolPuedeUsarEnlace('cliente') && !rolPuedeUsarEnlace('perito') && !rolPuedeUsarEnlace(null), 'cliente del portal y perito externo no entran por el enlace');
assert(SESION_SEG === 1800, 'la sesión dura 30 minutos');
// --- ip, origen, límite ---
const h = (m: Record<string, string>) => ({ get: (k: string) => m[k.toLowerCase()] ?? null });
assert(ipDe(h({ 'x-real-ip': '1.2.3.4', 'x-forwarded-for': '9.9.9.9, 5.6.7.8' })) === '1.2.3.4', 'IP: prefiere x-real-ip');
assert(ipDe(h({ 'x-forwarded-for': '6.6.6.6, 5.6.7.8' })) === '5.6.7.8', 'IP: la última del reenvío (la del proxy), no la que escribe el cliente');
assert(origenPermitido(null, 'cnp.com.co') && origenPermitido('https://cnp.com.co', 'cnp.com.co') && !origenPermitido('https://evil.example', 'cnp.com.co') && !origenPermitido('null', 'cnp.com.co'), 'origen: ausente o propio; ajeno o «null» no');
let t = 0;
const lim = crearLimitador(3, () => t);
assert(!lim('a') && !lim('a') && !lim('a') && lim('a'), 'límite por IP: el 4.º intento en un minuto se frena');
assert(!lim('b'), 'otra IP no se ve afectada');
t = 61_000;
assert(!lim('a'), 'pasado un minuto, vuelve a permitir');

// --- barrera estática del endpoint y la página ---
const route = read('src/app/api/auth/mcp-enlace/route.ts');
const middleware = read('src/middleware.ts');
const page = read('src/app/acceso-mcp/page.tsx');
const jwt = read('src/lib/auth/jwt.ts');
assert(/startsWith\('\/api\/auth\/'\)/.test(middleware), 'el endpoint cuelga de /api/auth/*, exento del middleware (el que llega aún no tiene sesión)');
assert(!/matcher[\s\S]*acceso-mcp/.test(middleware), 'la página /acceso-mcp es pública (fuera del matcher)');
assert(route.indexOf('origenPermitido(') < route.indexOf('canjearEnlace('), 'se valida el origen antes de canjear');
assert(route.indexOf('TOKEN_RE.test(') < route.indexOf('canjearEnlace('), 'se valida el formato del token antes de tocar la base');
assert(route.indexOf('DESTINO_RE.test(c.destino)') > route.indexOf('canjearEnlace(') && route.indexOf('DESTINO_RE.test(c.destino)') < route.indexOf('signToken('), 'el destino se revalida antes de firmar la sesión');
assert(/getUserByEmail\(c\.email\)/.test(route) && /!c\.email/.test(route), 'la sesión es la del usuario de CNP del correo del acceso; sin correo no hay sesión');
assert(/rolPuedeUsarEnlace\(role\)/.test(route), 'clientes del portal y peritos externos quedan fuera');
assert(/`\$\{SESION_SEG\}s`/.test(route) && /maxAge: SESION_SEG/.test(route), 'JWT y cookie duran 30 minutos, no los 7 días del inicio de sesión normal');
assert(!/allRoles: true/.test(route) && /hasAllRolesAccess\(user\.email, role\)/.test(route), 'allRoles solo si el usuario ya lo tiene (nunca se otorga por el enlace)');
assert(/'admin-token', ''/.test(route), 'una sola identidad por navegador: cierra la sesión de administración');
assert(/createAuditLog\(/.test(route), 'queda en la bitácora de auditoría');
assert(!/Set-Cookie|localStorage/.test(page) && /location\.hash/.test(page) && /replaceState/.test(page), 'la página lee el token del fragmento y lo borra de la barra de direcciones');
assert(/expiresIn = '7d'/.test(jwt), 'el inicio de sesión normal sigue durando 7 días (el enlace es la excepción)');

console.log(`\n${passed} pasaron, ${failed} fallaron`);
if (failed > 0) process.exit(1);
