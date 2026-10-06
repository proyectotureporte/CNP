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

    const cleanDisplayName = String(displayName || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = String(phone || '').trim();
    const cleanUsername = String(username || cleanDisplayName).trim();
    if (!cleanEmail || !cleanDisplayName || !password) {
      return NextResponse.json({ success: false, error: 'Email, nombre y contraseña son requeridos' }, { status: 400 });
    }
    if (cleanDisplayName.length < 2 || cleanDisplayName.length > 120 || cleanUsername.length < 2 || cleanUsername.length > 100) {
      return NextResponse.json({ success: false, error: 'Revisa el nombre y el nombre de usuario' }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanEmail.length > 254 || cleanPhone.length > 50) {
      return NextResponse.json({ success: false, error: 'Email o teléfono no válido' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
    }

    const userRole = role || 'comercial_juridico';
    if (!USER_ROLES.includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Rol invalido' }, { status: 400 });
    }

    const existing = await crmUser.getAnyUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json({ success: false, error: 'El email ya está registrado; puedes reactivar o editar esa cuenta' }, { status: 409 });
    }
    const existingUsername = await crmUser.getAnyUserByUsername(cleanUsername);
    if (existingUsername) {
      return NextResponse.json({ success: false, error: 'El nombre de usuario ya está registrado' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await crmUser.createUser({
      username: cleanUsername,
      displayName: cleanDisplayName,
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
      role: userRole,
      active: true,
    });

    if (user) triggerEvent('user:created', { id: user._id });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/admin/users:', error);
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ success: false, error: 'El email o nombre de usuario ya está registrado' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Error creando usuario' }, { status: 500 });
  }
}
