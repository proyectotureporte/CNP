import { NextResponse } from 'next/server';
import { adminConfig } from '@/lib/db';
import { hashPassword } from '@/lib/auth/passwords';

export async function POST() {
  try {
    const existing = await adminConfig.getAdminConfig();

    if (existing) {
      return NextResponse.json({ success: false, error: 'Admin ya inicializado' }, { status: 400 });
    }

    const masterHash = await hashPassword('Pump0517*');
    const secondaryHash = await hashPassword('Prueba1234*');

    await adminConfig.upsertAdminConfig({
      masterPasswordHash: masterHash,
      secondaryPasswordHash: secondaryHash,
    });

    return NextResponse.json({ success: true, data: { message: 'Admin inicializado correctamente' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error inicializando admin' }, { status: 500 });
  }
}
