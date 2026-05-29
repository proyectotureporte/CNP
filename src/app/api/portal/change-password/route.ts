import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/lib/auth/jwt';
import { crmUser } from '@/lib/db';
import { hashPassword } from '@/lib/auth/passwords';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('crm-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Token invalido' }, { status: 401 });
    }

    const body = await request.json();
    const { newPassword } = body as { newPassword?: string };

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'La contrasena debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await crmUser.setUserPassword(payload.sub, passwordHash, false);

    const newToken = await signToken({
      sub: payload.sub,
      role: payload.role,
      displayName: payload.displayName,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set('crm-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Error cambiando contrasena' }, { status: 500 });
  }
}
