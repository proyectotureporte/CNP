import { NextRequest, NextResponse } from 'next/server';
import { company } from '@/lib/db';
import type { Company } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const found = await company.getCompanyById(id);

    if (!found) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: found });
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

    const existing = await company.getCompanyById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    const updated = await company.updateCompany(id, {
      name, nit, type, address, city, country, phone, website, billingEmail, logoUrl, isActive,
    });
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
    const existing = await company.getCompanyById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Soft delete
    await company.updateCompany(id, { isActive: false });
    return NextResponse.json({ success: true, data: { message: 'Empresa desactivada' } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error eliminando empresa' },
      { status: 500 }
    );
  }
}
