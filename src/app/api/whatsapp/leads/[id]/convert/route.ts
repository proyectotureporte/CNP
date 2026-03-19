import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getWhatsappLeadByIdQuery } from '@/lib/sanity/queries';
import { hashPassword } from '@/lib/auth/passwords';
import { sendCredentialsEmail } from '@/lib/email';
import { triggerEvent } from '@/lib/pusher/server';
import type { WhatsappLead } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email, phone: overridePhone, company, position } = body;

    const agentName = request.headers.get('x-user-name') || 'Sistema';

    // Get lead data
    const lead = await client.fetch<WhatsappLead | null>(getWhatsappLeadByIdQuery, { id });

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead no encontrado' }, { status: 404 });
    }

    if (lead.status === 'convertido') {
      return NextResponse.json({ success: false, error: 'Lead ya fue convertido' }, { status: 400 });
    }

    // Use lead data, allow overrides
    const clientName = lead.name || 'Sin nombre';
    const clientPhone = overridePhone || lead.phone || '';
    const clientEmail = email?.trim().toLowerCase() || '';
    const clientBrand = lead.brand || 'Peritus';

    // Create client (same logic as POST /api/clients)
    const newClient = await writeClient.create({
      _type: 'crmClient',
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

    // Auto-create portal user if email provided
    let portalPassword: string | undefined;
    if (clientEmail) {
      const existingUser = await client.fetch<{ _id: string } | null>(
        `*[_type == "crmUser" && email == $email && active == true][0]{ _id }`,
        { email: clientEmail }
      );

      const clientIdSuffix = newClient._id.slice(-4);
      portalPassword = `CNP${clientIdSuffix}`;
      const passwordHash = await hashPassword(portalPassword);

      if (existingUser) {
        await writeClient.patch(existingUser._id).set({ passwordHash, mustChangePassword: true }).commit();
      } else {
        await writeClient.create({
          _type: 'crmUser',
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

      // Send credentials email
      sendCredentialsEmail({
        to: clientEmail,
        clientName,
        username: clientEmail,
        password: portalPassword,
      }).catch((err) => console.error('[convert] Email send failed:', err));
    }

    // Mark lead as converted
    await writeClient.patch(id).set({
      status: 'convertido',
      convertedClient: { _type: 'reference', _ref: newClient._id },
    }).commit();

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
