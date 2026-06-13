import { NextResponse } from 'next/server';
import type { UserRole } from '@/lib/types';

/**
 * Single source of truth for server-side role enforcement in API routes.
 * The role is injected by `src/middleware.ts` into the `x-user-role` request
 * header after verifying the JWT, so route handlers never re-parse the token.
 */

/** Role injected by middleware into the request headers (x-user-role). */
export function roleFromRequest(request: Request): UserRole | null {
  return (request.headers.get('x-user-role') as UserRole | null) ?? null;
}

/** Standard 403 response body. */
export function denied(message = 'Acceso denegado para tu rol') {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

/**
 * Guards an API handler by role. Pass a predicate from `permissions.ts`
 * (e.g. `canAssignExpert`). Returns a 403 `NextResponse` to short-circuit the
 * handler, or `null` when the role is allowed.
 *
 *   const stop = guardRole(request, canAssignExpert);
 *   if (stop) return stop;
 */
export function guardRole(
  request: Request,
  allows: (role: UserRole) => boolean
): NextResponse | null {
  const role = roleFromRequest(request);
  if (!role || !allows(role)) return denied();
  return null;
}
