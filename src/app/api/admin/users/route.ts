import { NextRequest, NextResponse } from 'next/server';
import { crmUser } from '@/lib/db';
import { hashPassword } from '@/lib/auth/passwords';
import { triggerEvent } from '@/lib/realtime/server';
import { USER_ROLES, type UserRole } from '@/lib/types';

export async function GET() {
  try {
    const users = await crmUser.listUsers();
    return NextResponse.json({ success: true, data: users });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo usuarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, displayName, password, email, phone, role } = body as {
      username?: string;
      displayName: string;
      password: string;
      email: string;
      phone?: string;
      role?: UserRole;
    };

    if (!email || !displayName || !password) {
      return NextResponse.json({ success: false, error: 'Email, nombre y contrasena son requeridos' }, { status: 400 });
    }

    const userRole = role || 'juridico';
    if (!USER_ROLES.includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Rol invalido' }, { status: 400 });
    }

    const existing = await crmUser.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ success: false, error: 'El email ya esta registrado' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await crmUser.createUser({
      username: username || displayName,
      displayName,
      email,
      phone: phone || '',
      passwordHash,
      role: userRole,
      active: true,
    });

    if (user) triggerEvent('user:created', { id: user._id });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/admin/users:', error);
    return NextResponse.json({ success: false, error: 'Error creando usuario' }, { status: 500 });
  }
}
