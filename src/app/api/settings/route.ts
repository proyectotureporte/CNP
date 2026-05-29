import { NextRequest, NextResponse } from 'next/server';
import { systemSetting } from '@/lib/db';

export async function GET() {
  try {
    const settings = await systemSetting.listSystemSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo configuracion' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;
    if (!key) return NextResponse.json({ success: false, error: 'Clave requerida' }, { status: 400 });

    const updated = await systemSetting.upsertSystemSetting({
      key,
      value: String(value),
      dataType: typeof value,
      description: body.description || '',
    });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando configuracion' }, { status: 500 });
  }
}
