import { NextRequest, NextResponse } from 'next/server';
import { getClientIdForUser } from '@/lib/auth/clientAccess';
import { actorFromRequest } from '@/lib/auth/caseAccess';
import { crmClient, crmUser, query, systemSetting } from '@/lib/db';

function clientActor(request: NextRequest) {
  const actor = actorFromRequest(request);
  return actor?.role === 'cliente' ? actor : null;
}

function publicAccount(value?: string | null): Record<string, string> {
  if (!value?.trim()) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>)
          .filter(([, item]) => ['string', 'number'].includes(typeof item))
          .map(([key, item]) => [key, String(item)]),
      );
    }
  } catch {
    // Los valores históricos pueden estar guardados como texto libre.
  }
  return { informacion: value };
}

export async function GET(request: NextRequest) {
  try {
    const actor = clientActor(request);
    if (!actor) return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    const clientId = await getClientIdForUser(actor.userId);
    if (!clientId) return NextResponse.json({ success: false, error: 'Perfil de cliente no vinculado' }, { status: 409 });

    const [user, client, caseBrands, cnpSetting, peritusSetting] = await Promise.all([
      crmUser.getUserById(actor.userId),
      crmClient.getClientById(clientId),
      query<{ brand: 'CNP' | 'Peritus' }>('SELECT DISTINCT brand FROM cases WHERE client_id = $1 ORDER BY brand', [clientId]),
      systemSetting.getSystemSetting('payment_account_cnp'),
      systemSetting.getSystemSetting('payment_account_peritus'),
    ]);
    if (!user || !client) return NextResponse.json({ success: false, error: 'Perfil no encontrado' }, { status: 404 });

    const brands = [...new Set([client.brand, ...caseBrands.map((item) => item.brand)])];
    return NextResponse.json({
      success: true,
      data: {
        profile: {
          name: client.name,
          email: client.email || user.email,
          phone: client.phone || user.phone,
          company: client.company || '',
          position: client.position || '',
          clientType: client.clientType,
        },
        paymentAccounts: brands.map((brand) => ({
          brand,
          details: publicAccount(brand === 'Peritus' ? peritusSetting?.value : cnpSetting?.value),
        })),
      },
    });
  } catch (error) {
    console.error('[portal-profile] GET error:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo el perfil' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = clientActor(request);
    if (!actor) return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    const clientId = await getClientIdForUser(actor.userId);
    if (!clientId) return NextResponse.json({ success: false, error: 'Perfil de cliente no vinculado' }, { status: 409 });

    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const company = String(body.company || '').trim();
    const position = String(body.position || '').trim();
    if (name.length < 2 || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Nombre y correo válidos son obligatorios' }, { status: 400 });
    }

    const [client] = await Promise.all([
      crmClient.updateClient(clientId, { name, email, phone, company, position }),
      crmUser.updateUser(actor.userId, { displayName: name, email, phone }),
    ]);
    return NextResponse.json({
      success: true,
      data: client && { name: client.name, email: client.email, phone: client.phone, company: client.company, position: client.position, clientType: client.clientType },
    });
  } catch (error) {
    console.error('[portal-profile] PUT error:', error);
    return NextResponse.json({ success: false, error: 'Error actualizando el perfil' }, { status: 500 });
  }
}
