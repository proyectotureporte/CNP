import { SignJWT, jwtVerify } from 'jose';
import { normalizeUserRole, type UserRole } from '@/lib/types';

export interface JWTPayload {
  sub: string;
  role: UserRole;
  displayName: string;
  allRoles?: boolean;
}

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = normalizeUserRole(typeof payload.role === 'string' ? payload.role : null);
    if (!role || typeof payload.sub !== 'string' || typeof payload.displayName !== 'string') return null;
    return {
      sub: payload.sub,
      role,
      displayName: payload.displayName,
      allRoles: payload.allRoles === true,
    };
  } catch {
    return null;
  }
}
