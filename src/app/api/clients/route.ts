import { NextRequest, NextResponse } from 'next/server';
import { crmClient, crmUser, registroPeritus } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { canCreateClient } from '@/lib/auth/permissions';
import { verifyToken } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/passwords';
import { sendCredentialsEmail } from '@/lib/email';
import { triggerEvent } from '@/lib/realtime/server';
import { actorFromRequest } from '@/lib/auth/caseAccess';
import { CLIENT_TYPES, type ClientType } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const actor = actorFromRequest(request);
    if (!actor || !['admin', 'juridico', 'mercadeo', 'financiero'].includes(actor.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    const userRole = actor.role;
    const userId = actor.userId;
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
    const stop = guardRole(request, canCreateClient);
    if (stop) return stop;

    const body = await request.json();
    const { name, email, phone, company, position, notes, status, brand, clientType } = body as {
      name: string;
      email?: string;
      phone?: string;
      company?: string;
      position?: string;
      notes?: string;
      status?: string;
      brand?: string;
      clientType?: string;
    };

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }
    if (clientType && !CLIENT_TYPES.includes(clientType as ClientType)) {
      return NextResponse.json({ success: false, error: 'Tipo de cliente no válido' }, { status: 400 });
    }

    const normalizedEmail = email?.trim().toLowerCase() || '';
    const existingPortalUser = normalizedEmail
      ? await crmUser.getUserByEmail(normalizedEmail)
      : null;
    if (existingPortalUser && existingPortalUser.role !== 'cliente') {
      return NextResponse.json(
        { success: false, error: 'El correo ya pertenece a un usuario interno y no puede usarse como cliente final' },
        { status: 409 },
      );
    }
    if (existingPortalUser?.clientId) {
      return NextResponse.json(
        { success: false, error: 'El correo ya está vinculado a otro perfil de cliente final' },
        { status: 409 },
      );
    }

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
      clientType: (clientType as ClientType) || 'persona_natural',
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
      portalPassword = `CNP${newClient._id.slice(-4)}`;
      const passwordHash = await hashPassword(portalPassword);

      if (existingPortalUser) {
        await crmUser.updateUser(existingPortalUser._id, { clientId: newClient._id });
        await crmUser.setUserPassword(existingPortalUser._id, passwordHash, true);
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
          clientId: newClient._id,
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
