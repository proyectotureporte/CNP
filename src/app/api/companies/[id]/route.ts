import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getCompanyByIdQuery } from '@/lib/sanity/queries';
import type { Company } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await client.fetch<Company | null>(getCompanyByIdQuery, { id });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: company });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo empresa' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, nit, type, address, city, country, phone, website, billingEmail, logoUrl, isActive } = body as Partial<Company>;

    const existing = await client.fetch<Company | null>(getCompanyByIdQuery, { id });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (nit !== undefined) updates.nit = nit;
    if (type !== undefined) updates.type = type;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (country !== undefined) updates.country = country;
    if (phone !== undefined) updates.phone = phone;
    if (website !== undefined) updates.website = website;
    if (billingEmail !== undefined) updates.billingEmail = billingEmail;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await writeClient.patch(id).set(updates).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando empresa' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await client.fetch<Company | null>(getCompanyByIdQuery, { id });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Soft delete
    await writeClient.patch(id).set({ isActive: false }).commit();
    return NextResponse.json({ success: true, data: { message: 'Empresa desactivada' } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error eliminando empresa' },
      { status: 500 }
    );
  }
}
