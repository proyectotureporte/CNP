import { NextRequest, NextResponse } from 'next/server';
import { company } from '@/lib/db';
import type { Company } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const companies = search
      ? await company.searchCompanies(search)
      : await company.listCompanies();

    return NextResponse.json({ success: true, data: companies });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo empresas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nit, type, address, city, country, phone, website, billingEmail, logoUrl } = body as Partial<Company>;

    if (!name || !nit || !type) {
      return NextResponse.json(
        { success: false, error: 'Nombre, NIT y tipo son requeridos' },
        { status: 400 }
      );
    }

    const created = await company.createCompany({
      name, nit, type, address, city, country, phone, website, billingEmail, logoUrl,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error creando empresa' },
      { status: 500 }
    );
  }
}
