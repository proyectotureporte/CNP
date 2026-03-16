import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listWhatsappMessagesQuery } from '@/lib/sanity/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = await client.fetch(listWhatsappMessagesQuery, { leadId: id });
    return NextResponse.json({ success: true, data: messages });
  } catch (err) {
    console.error('[whatsapp/leads/id/messages] GET error:', err);
    return NextResponse.json({ success: false, error: 'Error obteniendo mensajes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Contenido requerido' }, { status: 400 });
    }

    const agentName = request.headers.get('x-user-name') || 'Agente';

    // Get lead phone number
    const lead = await client.fetch<{ phone: string } | null>(
      `*[_type == "whatsappLead" && _id == $id][0]{ phone }`,
      { id }
    );

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead no encontrado' }, { status: 404 });
    }

    // Send via Evolution API
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;
    const evolutionInstance = process.env.EVOLUTION_INSTANCE || 'Peritus';

    if (!evolutionUrl || !evolutionKey) {
      return NextResponse.json({ success: false, error: 'Evolution API no configurada' }, { status: 500 });
    }

    const waResponse = await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: evolutionKey,
      },
      body: JSON.stringify({
        number: lead.phone,
        text: content.trim(),
      }),
    });

    if (!waResponse.ok) {
      const errText = await waResponse.text();
      console.error('[whatsapp/send] Evolution API error:', errText);
      return NextResponse.json({ success: false, error: 'Error enviando mensaje WhatsApp' }, { status: 502 });
    }

    // Save message in Sanity
    const now = new Date().toISOString();
    const message = await writeClient.create({
      _type: 'whatsappMessage',
      lead: { _type: 'reference', _ref: id },
      direction: 'outgoing',
      content: content.trim(),
      sender: 'agent',
      agentName,
      timestamp: now,
    });

    // Update lead timestamp
    await writeClient.patch(id).set({ lastMessageAt: now }).commit();

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (err) {
    console.error('[whatsapp/leads/id/messages] POST error:', err);
    return NextResponse.json({ success: false, error: 'Error enviando mensaje' }, { status: 500 });
  }
}
