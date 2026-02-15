import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getCrmUserByIdQuery } from '@/lib/sanity/queries';
import { comparePassword, hashPassword } from '@/lib/auth/passwords';
import { verifyToken } from '@/lib/auth/jwt';
import type { CrmUser } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('crm-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload || payload.sub === 'admin') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Ambas contraseñas son requeridas' },
        { status: 400 }
      );
    }

    const user = await client.fetch<CrmUser | null>(getCrmUserByIdQuery, { id: payload.sub });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const validCurrent = await comparePassword(currentPassword, user.passwordHash);
    if (!validCurrent) {
      return NextResponse.json(
        { success: false, error: 'Contraseña actual incorrecta' },
        { status: 401 }
      );
    }

    const newHash = await hashPassword(newPassword);
    await writeClient.patch(user._id).set({ passwordHash: newHash }).commit();

    return NextResponse.json({
      success: true,
      data: { message: 'Contraseña actualizada' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error cambiando contraseña' },
      { status: 500 }
    );
  }
}
