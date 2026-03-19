import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listClientsQuery, listClientsForFinancieroQuery } from '@/lib/sanity/queries';
import { verifyToken } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/passwords';
import { sendCredentialsEmail } from '@/lib/email';
import { triggerEvent } from '@/lib/pusher/server';
import type { CrmClient } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role') || '';
    const userId = request.headers.get('x-user-id') || '';
    const search = request.nextUrl.searchParams.get('search') || '';
    const brand = request.nextUrl.searchParams.get('brand') || '';

    // Financiero users can only see clients from their assigned cases
    if (userRole === 'financiero' && userId) {
      const clients = await client.fetch<CrmClient[]>(listClientsForFinancieroQuery, { userId, search, brand });
      return NextResponse.json({ success: true, data: clients });
    }

    const clients = await client.fetch<CrmClient[]>(listClientsQuery, { search, brand });
    return NextResponse.json({ success: true, data: clients });
  } catch (err) {
    console.error('[clients] GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Error obteniendo clientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, company, position, notes, status, brand } = body as {
      name: string;
      email?: string;
      phone?: string;
      company?: string;
      position?: string;
      notes?: string;
      status?: string;
      brand?: string;
    };

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email?.trim().toLowerCase() || '';

    // Get user info from token
    const crmToken = request.cookies.get('crm-token')?.value;
    const adminToken = request.cookies.get('admin-token')?.value;
    const token = crmToken || adminToken;
    const payload = token ? await verifyToken(token) : null;

    const newClient = await writeClient.create({
      _type: 'crmClient',
      brand: brand || 'CNP',
      name,
      email: normalizedEmail,
      phone: phone || '',
      company: company || '',
      position: position || '',
      notes: notes || '',
      status: status || 'prospecto',
      createdBy: payload?.displayName || 'Sistema',
    });

    // Auto-create portal user for the client if email is provided
    let portalPassword: string | undefined;
    if (normalizedEmail) {
      // Check if a crmUser with this email already exists
      const existingUser = await client.fetch<{ _id: string } | null>(
        `*[_type == "crmUser" && email == $email && active == true][0]{ _id }`,
        { email: normalizedEmail }
      );

      // Generate a generic password: CNP + last 4 chars of client ID
      const clientIdSuffix = newClient._id.slice(-4);
      portalPassword = `CNP${clientIdSuffix}`;
      const passwordHash = await hashPassword(portalPassword);

      if (existingUser) {
        // Update existing user's password instead of creating a duplicate
        await writeClient.patch(existingUser._id).set({ passwordHash, mustChangePassword: true }).commit();
      } else {
        await writeClient.create({
          _type: 'crmUser',
          username: normalizedEmail,
          email: normalizedEmail,
          displayName: name,
          phone: phone || '',
          passwordHash,
          role: 'cliente',
          active: true,
          mustChangePassword: true,
        });
      }

      // Fire-and-forget: send credentials email
      sendCredentialsEmail({
        to: normalizedEmail,
        clientName: name,
        username: normalizedEmail,
        password: portalPassword,
      }).catch((err) => console.error('[clients] Email send failed:', err));
    }

    triggerEvent('client:created', { id: newClient._id });

    return NextResponse.json({
      success: true,
      data: newClient,
      portalPassword: portalPassword || null,
    }, { status: 201 });
  } catch (err) {
    console.error('[clients] POST error:', err);
    return NextResponse.json(
      { success: false, error: 'Error creando cliente' },
      { status: 500 }
    );
  }
}
