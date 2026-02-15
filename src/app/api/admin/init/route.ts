import { NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getAdminConfigQuery } from '@/lib/sanity/queries';
import { hashPassword } from '@/lib/auth/passwords';
import type { AdminConfig } from '@/lib/types';

export async function POST() {
  try {
    const existing = await client.fetch<AdminConfig | null>(getAdminConfigQuery);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Admin ya inicializado' },
        { status: 400 }
      );
    }

    const masterHash = await hashPassword('Pump0517*');
    const secondaryHash = await hashPassword('Prueba1234*');

    await writeClient.create({
      _type: 'adminConfig',
      masterPasswordHash: masterHash,
      secondaryPasswordHash: secondaryHash,
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Admin inicializado correctamente' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error inicializando admin' },
      { status: 500 }
    );
  }
}
