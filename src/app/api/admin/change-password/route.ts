import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getAdminConfigQuery } from '@/lib/sanity/queries';
import { comparePassword, hashPassword } from '@/lib/auth/passwords';
import type { AdminConfig } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
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

    const config = await client.fetch<AdminConfig | null>(getAdminConfigQuery);
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Sistema no inicializado' },
        { status: 500 }
      );
    }

    // Verify current secondary password
    const validCurrent = await comparePassword(currentPassword, config.secondaryPasswordHash);
    if (!validCurrent) {
      return NextResponse.json(
        { success: false, error: 'Contraseña actual incorrecta' },
        { status: 401 }
      );
    }

    const newHash = await hashPassword(newPassword);

    await writeClient.patch(config._id).set({ secondaryPasswordHash: newHash }).commit();

    return NextResponse.json({
      success: true,
      data: { message: 'Contraseña secundaria actualizada' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error cambiando contraseña' },
      { status: 500 }
    );
  }
}
