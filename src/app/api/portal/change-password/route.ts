import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/lib/auth/jwt';
import { writeClient } from '@/lib/sanity/client';
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
      return NextResponse.json(
        { success: false, error: 'La contrasena debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await writeClient
      .patch(payload.sub)
      .set({ passwordHash, mustChangePassword: false })
      .commit();

    // Re-sign token with same data
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
    return NextResponse.json(
      { success: false, error: 'Error cambiando contrasena' },
      { status: 500 }
    );
  }
}
