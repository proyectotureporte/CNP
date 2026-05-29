import { NextRequest, NextResponse } from 'next/server';
import { whatsappLead, crmClient, crmUser } from '@/lib/db';
import { hashPassword } from '@/lib/auth/passwords';
import { sendCredentialsEmail } from '@/lib/email';
import { triggerEvent } from '@/lib/pusher/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email, phone: overridePhone, company, position } = body;

    const agentName = request.headers.get('x-user-name') || 'Sistema';

    const lead = await whatsappLead.getWhatsappLeadById(id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead no encontrado' }, { status: 404 });
    }
    if (lead.status === 'convertido') {
      return NextResponse.json({ success: false, error: 'Lead ya fue convertido' }, { status: 400 });
    }

    const clientName = lead.name || 'Sin nombre';
    const clientPhone = overridePhone || lead.phone || '';
    const clientEmail = email?.trim().toLowerCase() || '';
    const clientBrand = lead.brand || 'Peritus';

    const newClient = await crmClient.createClient({
      brand: clientBrand,
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      company: company || '',
      position: position || '',
      notes: `Convertido desde WhatsApp.\nCiudad: ${lead.city || 'N/A'}\nMotivo: ${lead.motive || 'N/A'}`,
      status: 'prospecto',
      createdBy: agentName,
    });

    if (!newClient) {
      return NextResponse.json({ success: false, error: 'Error creando cliente' }, { status: 500 });
    }

    // Auto-create portal user if email provided
    let portalPassword: string | undefined;
    if (clientEmail) {
      const existingUser = await crmUser.getUserByEmail(clientEmail);
      portalPassword = `CNP${newClient._id.slice(-4)}`;
      const passwordHash = await hashPassword(portalPassword);

      if (existingUser) {
        await crmUser.setUserPassword(existingUser._id, passwordHash, true);
      } else {
        await crmUser.createUser({
          username: clientEmail,
          email: clientEmail,
          displayName: clientName,
          phone: clientPhone,
          passwordHash,
          role: 'cliente',
          active: true,
          mustChangePassword: true,
        });
      }

      sendCredentialsEmail({
        to: clientEmail,
        clientName,
        username: clientEmail,
        password: portalPassword,
      }).catch((err) => console.error('[convert] Email send failed:', err));
    }

    await whatsappLead.updateWhatsappLead(id, {
      status: 'convertido',
      convertedClientId: newClient._id,
    });

    triggerEvent('whatsapp:lead', { id, converted: true });

    return NextResponse.json({
      success: true,
      data: {
        client: newClient,
        portalPassword: portalPassword || null,
        leadDocuments: lead.documents || [],
      },
    }, { status: 201 });
  } catch (err) {
    console.error('[whatsapp/leads/id/convert] POST error:', err);
    return NextResponse.json({ success: false, error: 'Error convirtiendo lead' }, { status: 500 });
  }
}
