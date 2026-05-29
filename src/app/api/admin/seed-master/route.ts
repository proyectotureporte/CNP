import { NextResponse } from 'next/server';
import { crmUser } from '@/lib/db';
import { hashPassword } from '@/lib/auth/passwords';

const MASTER_EMAIL = 'maestro@cnp.com.co';

export async function POST() {
  try {
    const existing = await crmUser.getUserByEmail(MASTER_EMAIL);
    if (existing) {
      return NextResponse.json({ success: false, error: 'El usuario maestro ya existe' }, { status: 400 });
    }

    const passwordHash = await hashPassword('Prueba1234*');

    await crmUser.createUser({
      username: MASTER_EMAIL,
      email: MASTER_EMAIL,
      displayName: 'Usuario Maestro',
      phone: '',
      passwordHash,
      role: 'admin',
      active: true,
      mustChangePassword: false,
    });

    return NextResponse.json({ success: true, data: { message: 'Usuario maestro creado', email: MASTER_EMAIL } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando usuario maestro' }, { status: 500 });
  }
}
