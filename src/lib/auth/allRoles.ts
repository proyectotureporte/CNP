/**
 * Acceso combinado solicitado para la cuenta de supervisión de Ferney.
 * La bandera viaja dentro del JWT firmado; nunca se confía en un header
 * enviado directamente por el navegador.
 */
const DEFAULT_ALL_ROLES_EMAIL = 'ferneyolicas@gmail.com';

export function hasAllRolesAccess(email: string | null | undefined): boolean {
  if (!email) return false;
  const configured = process.env.ALL_ROLES_EMAILS || DEFAULT_ALL_ROLES_EMAIL;
  const allowed = configured
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export function requestHasAllRoles(request: Request): boolean {
  return request.headers.get('x-user-all-roles') === 'true';
}
