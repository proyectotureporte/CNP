import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listCompaniesQuery, searchCompaniesQuery } from '@/lib/sanity/queries';
import type { Company } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let companies: Company[];
    if (search) {
      companies = await client.fetch<Company[]>(searchCompaniesQuery, { search });
    } else {
      companies = await client.fetch<Company[]>(listCompaniesQuery);
    }

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

    const company = await writeClient.create({
      _type: 'company',
      name,
      nit,
      type,
      address: address || '',
      city: city || '',
      country: country || 'Colombia',
      phone: phone || '',
      website: website || '',
      billingEmail: billingEmail || '',
      logoUrl: logoUrl || '',
      isActive: true,
    });

    return NextResponse.json({ success: true, data: company }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error creando empresa' },
      { status: 500 }
    );
  }
}
