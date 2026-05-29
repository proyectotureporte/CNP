import { NextRequest, NextResponse } from 'next/server';
import { adminConfig } from '@/lib/db';
import { comparePassword, hashPassword } from '@/lib/auth/passwords';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body as { currentPassword: string; newPassword: string };

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Ambas contraseñas son requeridas' }, { status: 400 });
    }

    const config = await adminConfig.getAdminConfig();
    if (!config) {
      return NextResponse.json({ success: false, error: 'Sistema no inicializado' }, { status: 500 });
    }

    const validCurrent = await comparePassword(currentPassword, config.secondaryPasswordHash);
    if (!validCurrent) {
      return NextResponse.json({ success: false, error: 'Contraseña actual incorrecta' }, { status: 401 });
    }

    const newHash = await hashPassword(newPassword);
    await adminConfig.upsertAdminConfig({ secondaryPasswordHash: newHash });

    return NextResponse.json({ success: true, data: { message: 'Contraseña secundaria actualizada' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error cambiando contraseña' }, { status: 500 });
  }
}
