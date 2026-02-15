import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listClientsQuery } from '@/lib/sanity/queries';
import { verifyToken } from '@/lib/auth/jwt';
import type { CrmClient } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') || '';
    const clients = await client.fetch<CrmClient[]>(listClientsQuery, { search });
    return NextResponse.json({ success: true, data: clients });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo clientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, company, position, notes, status } = body as {
      name: string;
      email?: string;
      phone?: string;
      company?: string;
      position?: string;
      notes?: string;
      status?: string;
    };

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Get user info from token
    const crmToken = request.cookies.get('crm-token')?.value;
    const adminToken = request.cookies.get('admin-token')?.value;
    const token = crmToken || adminToken;
    const payload = token ? await verifyToken(token) : null;

    const newClient = await writeClient.create({
      _type: 'crmClient',
      name,
      email: email || '',
      phone: phone || '',
      company: company || '',
      position: position || '',
      notes: notes || '',
      status: status || 'prospecto',
      createdBy: payload?.displayName || 'Sistema',
    });

    return NextResponse.json({ success: true, data: newClient }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error creando cliente' },
      { status: 500 }
    );
  }
}
