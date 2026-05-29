import { NextRequest, NextResponse } from 'next/server';
import { whatsappMessage, whatsappLead, queryOne } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = await whatsappMessage.listWhatsappMessages(id);
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

    const lead = await queryOne<{ phone: string }>('SELECT phone FROM whatsapp_lead WHERE id = $1', [id]);
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
      headers: { 'Content-Type': 'application/json', apikey: evolutionKey },
      body: JSON.stringify({ number: lead.phone, text: content.trim() }),
    });

    if (!waResponse.ok) {
      const errText = await waResponse.text();
      console.error('[whatsapp/send] Evolution API error:', errText);
      return NextResponse.json({ success: false, error: 'Error enviando mensaje WhatsApp' }, { status: 502 });
    }

    const messageId = await whatsappMessage.createWhatsappMessage({
      leadId: id,
      direction: 'outgoing',
      content: content.trim(),
      sender: 'agent',
      agentName,
      timestamp: new Date().toISOString(),
    });

    await whatsappLead.setLeadLastMessageNow(id);

    triggerEvent('whatsapp:message', { leadId: id });

    return NextResponse.json({ success: true, data: { _id: messageId } }, { status: 201 });
  } catch (err) {
    console.error('[whatsapp/leads/id/messages] POST error:', err);
    return NextResponse.json({ success: false, error: 'Error enviando mensaje' }, { status: 500 });
  }
}
