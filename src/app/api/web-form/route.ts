import { NextRequest, NextResponse } from 'next/server';
import { webLead } from '@/lib/db';
import { sendWebFormConfirmationEmail } from '@/lib/email';
import { z } from 'zod';

const schema = z.object({
  nombre: z.string().trim().min(1).max(100),
  email: z.string().email(),
  telefono: z.string().trim().regex(/^\+?[0-9\s()-]{7,20}$/),
  mensaje: z.string().trim().min(1).max(2000),
  origen: z.enum(['landing', 'abogados', 'empresas', 'jueces', 'masterclass']).default('landing'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    await webLead.createWebLead({
      nombre: result.data.nombre,
      email: result.data.email,
      telefono: result.data.telefono,
      mensaje: result.data.mensaje,
      origen: result.data.origen,
      estado: 'nuevo',
    });

    sendWebFormConfirmationEmail({
      to: result.data.email,
      nombre: result.data.nombre,
      origen: result.data.origen,
    }).catch((err) => console.error('[web-form] Confirmation email failed:', err));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}
