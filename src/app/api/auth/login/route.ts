import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { getAdminConfigQuery, getCrmUserByEmailQuery } from '@/lib/sanity/queries';
import { comparePassword } from '@/lib/auth/passwords';
import { signToken } from '@/lib/auth/jwt';
import type { AdminConfig, CrmUser } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, type } = body as {
      email?: string;
      password: string;
      type: 'admin' | 'crm';
    };

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Contrasena requerida' },
        { status: 400 }
      );
    }

    // Admin login - password only
    if (type === 'admin') {
      const config = await client.fetch<AdminConfig | null>(getAdminConfigQuery);
      if (!config) {
        return NextResponse.json(
          { success: false, error: 'Sistema no inicializado. Ejecute /api/admin/init primero.' },
          { status: 500 }
        );
      }

      const isMaster = await comparePassword(password, config.masterPasswordHash);
      const isSecondary = !isMaster && await comparePassword(password, config.secondaryPasswordHash);

      if (!isMaster && !isSecondary) {
        return NextResponse.json(
          { success: false, error: 'Contrasena incorrecta' },
          { status: 401 }
        );
      }

      const token = await signToken({
        sub: 'admin',
        role: 'admin',
        displayName: 'Administrador',
      });

      const response = NextResponse.json({
        success: true,
        data: { role: 'admin', displayName: 'Administrador' },
      });

      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // CRM login - username + password (all roles except admin-only)
    if (type === 'crm') {
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Email requerido' },
          { status: 400 }
        );
      }

      const user = await client.fetch<CrmUser | null>(getCrmUserByEmailQuery, { email });
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Email o contrasena incorrectos' },
          { status: 401 }
        );
      }

      const validPassword = await comparePassword(password, user.passwordHash);
      if (!validPassword) {
        return NextResponse.json(
          { success: false, error: 'Email o contrasena incorrectos' },
          { status: 401 }
        );
      }

      const token = await signToken({
        sub: user._id,
        role: user.role || 'comercial',
        displayName: user.displayName,
      });

      const response = NextResponse.json({
        success: true,
        data: {
          role: user.role || 'comercial',
          displayName: user.displayName,
          userId: user._id,
        },
      });

      response.cookies.set('crm-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Tipo de login invalido' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
