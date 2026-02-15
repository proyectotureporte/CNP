import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listSystemSettingsQuery, getSystemSettingQuery } from '@/lib/sanity/queries';

export async function GET() {
  try {
    const settings = await client.fetch(listSystemSettingsQuery);
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

    const existing = await client.fetch(getSystemSettingQuery, { key });
    if (existing) {
      const updated = await writeClient.patch(existing._id).set({ value: String(value) }).commit();
      return NextResponse.json({ success: true, data: updated });
    } else {
      const created = await writeClient.create({
        _type: 'systemSetting',
        key,
        value: String(value),
        dataType: typeof value,
        description: body.description || '',
      });
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando configuracion' }, { status: 500 });
  }
}
