import { NextRequest, NextResponse } from 'next/server';
import { writeClient } from '@/lib/sanity/client';
import { z } from 'zod';

const schema = z.object({
  nombre: z.string().max(100).optional(),
  email: z.string().email(),
  mensaje: z.string().max(2000).optional(),
  origen: z.enum(['landing', 'abogados', 'empresas', 'jueces']).default('landing'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    await writeClient.create({
      _type: 'webLead',
      nombre: result.data.nombre || '',
      email: result.data.email,
      mensaje: result.data.mensaje || '',
      origen: result.data.origen,
      estado: 'nuevo',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}
