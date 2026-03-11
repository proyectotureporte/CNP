import { NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { hashPassword } from '@/lib/auth/passwords';

const MASTER_EMAIL = 'maestro@cnp.com.co';

export async function POST() {
  try {
    const existing = await client.fetch<{ _id: string } | null>(
      `*[_type == "crmUser" && email == $email][0]{ _id }`,
      { email: MASTER_EMAIL }
    );

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'El usuario maestro ya existe' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword('Prueba1234*');

    await writeClient.create({
      _type: 'crmUser',
      username: MASTER_EMAIL,
      email: MASTER_EMAIL,
      displayName: 'Usuario Maestro',
      phone: '',
      passwordHash,
      role: 'admin',
      active: true,
      mustChangePassword: false,
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Usuario maestro creado', email: MASTER_EMAIL },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error creando usuario maestro' },
      { status: 500 }
    );
  }
}
