import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listAllCrmUsersQuery, getCrmUserByEmailQuery } from '@/lib/sanity/queries';
import { hashPassword } from '@/lib/auth/passwords';
import type { CrmUser, UserRole } from '@/lib/types';
import { USER_ROLES } from '@/lib/types';

export async function GET() {
  try {
    const users = await client.fetch<CrmUser[]>(listAllCrmUsersQuery);
    return NextResponse.json({ success: true, data: users });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo usuarios' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { success: false, error: 'Email, nombre y contrasena son requeridos' },
        { status: 400 }
      );
    }

    // Validate role if provided
    const userRole = role || 'comercial';
    if (!USER_ROLES.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Rol invalido' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await client.fetch<CrmUser | null>(getCrmUserByEmailQuery, { email });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'El email ya esta registrado' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await writeClient.create({
      _type: 'crmUser',
      username: username || displayName,
      displayName,
      email,
      phone: phone || '',
      passwordHash,
      role: userRole,
      active: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        _id: user._id,
        username: username || displayName,
        displayName,
        email,
        phone: phone || '',
        role: userRole,
        active: true,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error creando usuario' },
      { status: 500 }
    );
  }
}
