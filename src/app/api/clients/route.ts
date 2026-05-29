import { NextRequest, NextResponse } from 'next/server';
import { crmClient, crmUser, registroPeritus } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/passwords';
import { sendCredentialsEmail } from '@/lib/email';
import { triggerEvent } from '@/lib/realtime/server';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role') || '';
    const userId = request.headers.get('x-user-id') || '';
    const search = request.nextUrl.searchParams.get('search') || '';
    const brand = request.nextUrl.searchParams.get('brand') || '';

    // Financiero users can only see clients from their assigned cases
    if (userRole === 'financiero' && userId) {
      const clients = await crmClient.listClientsForFinanciero(userId, { search, brand });
      return NextResponse.json({ success: true, data: clients });
    }

    const clients = await crmClient.listClients({ search, brand });
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

    const normalizedEmail = email?.trim().toLowerCase() || '';

    // Get user info from token
    const crmToken = request.cookies.get('crm-token')?.value;
    const adminToken = request.cookies.get('admin-token')?.value;
    const token = crmToken || adminToken;
    const payload = token ? await verifyToken(token) : null;

    const newClient = await crmClient.createClient({
      brand: (brand as 'CNP' | 'Peritus') || 'CNP',
      name,
      email: normalizedEmail,
      phone: phone || '',
      company: company || '',
      position: position || '',
      notes: notes || '',
      status: (status as 'activo' | 'inactivo' | 'prospecto') || 'prospecto',
      createdBy: payload?.displayName || 'Sistema',
    });

    if (!newClient) {
      return NextResponse.json({ success: false, error: 'Error creando cliente' }, { status: 500 });
    }

    if (brand === 'Peritus') {
      await registroPeritus.createRegistroPeritus({
        peritusId: `PER-${newClient._id.slice(-6).toUpperCase()}`,
        nombreApellido: name,
        correo: normalizedEmail,
        celular: phone || '',
        clientId: newClient._id,
        fechaRegistro: new Date().toISOString(),
        estadoDocumentacion: 'pendiente',
        activo: true,
      });
    }

    // Auto-create portal user for the client if email is provided
    let portalPassword: string | undefined;
    if (normalizedEmail) {
      const existingUser = await crmUser.getUserByEmail(normalizedEmail);

      portalPassword = `CNP${newClient._id.slice(-4)}`;
      const passwordHash = await hashPassword(portalPassword);

      if (existingUser) {
        await crmUser.setUserPassword(existingUser._id, passwordHash, true);
      } else {
        await crmUser.createUser({
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
