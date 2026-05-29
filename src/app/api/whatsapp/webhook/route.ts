import { NextRequest, NextResponse } from 'next/server';
import { whatsappLead, whatsappMessage } from '@/lib/db';
import { uploadFile } from '@/lib/sanity/assets';
import { triggerEvent } from '@/lib/pusher/server';

// Public endpoint for n8n automation - protected by API key
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    const authHeader = request.headers.get('x-webhook-secret') || request.headers.get('authorization')?.replace('Bearer ', '');

    if (webhookSecret && authHeader !== webhookSecret) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (type === 'message') return handleMessage(body);
    if (type === 'complete') return handleComplete(body);
    if (type === 'document') return handleDocument(body);

    return NextResponse.json({ success: false, error: 'Tipo no válido' }, { status: 400 });
  } catch (err) {
    console.error('[whatsapp/webhook] Error:', err);
    return NextResponse.json({ success: false, error: 'Error procesando webhook' }, { status: 500 });
  }
}

async function handleMessage(body: {
  phone: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  sender: 'client' | 'ai' | 'agent';
}) {
  const { phone, content, direction, sender } = body;

  if (!phone || !content) {
    return NextResponse.json({ success: false, error: 'phone y content requeridos' }, { status: 400 });
  }

  const leadId = await whatsappLead.findOrCreateLeadByPhone(phone);

  await whatsappMessage.createWhatsappMessage({
    leadId,
    direction,
    content,
    sender: sender || (direction === 'incoming' ? 'client' : 'ai'),
    timestamp: new Date().toISOString(),
  });

  if (direction === 'incoming') {
    await whatsappLead.touchLeadIncomingMessage(leadId);
  } else {
    await whatsappLead.setLeadLastMessageNow(leadId);
  }

  triggerEvent('whatsapp:message', {});

  return NextResponse.json({ success: true, leadId }, { status: 201 });
}

async function handleComplete(body: {
  phone: string;
  nombre: string;
  ciudad: string;
  motivo: string;
  observacion: string;
  mensaje: string;
}) {
  const { phone, nombre, ciudad, motivo, observacion, mensaje } = body;

  if (!phone) {
    return NextResponse.json({ success: false, error: 'phone requerido' }, { status: 400 });
  }

  const leadId = await whatsappLead.findOrCreateLeadByPhone(phone);

  const isCNP = observacion?.toLowerCase().includes('s') && observacion?.toLowerCase() !== 'no' && observacion?.toLowerCase() !== 'no aplica';
  const brand = isCNP ? 'CNP' : 'Peritus';

  await whatsappLead.updateWhatsappLead(leadId, {
    name: nombre || '',
    city: ciudad || '',
    motive: motivo || '',
    brand,
    status: 'completado',
    aiCompleted: true,
    aiSummary: mensaje || '',
    lastMessageAt: new Date().toISOString(),
  });

  triggerEvent('whatsapp:message', {});

  return NextResponse.json({ success: true, leadId, brand }, { status: 200 });
}

async function handleDocument(body: {
  phone: string;
  fileName: string;
  mimeType: string;
  fileBase64?: string;
  fileUrl?: string;
}) {
  const { phone, fileName, mimeType, fileBase64, fileUrl } = body;

  if (!phone || !fileName) {
    return NextResponse.json({ success: false, error: 'phone y fileName requeridos' }, { status: 400 });
  }

  const leadId = await whatsappLead.findOrCreateLeadByPhone(phone);

  let buffer: Buffer | null = null;
  if (fileBase64) {
    buffer = Buffer.from(fileBase64, 'base64');
  } else if (fileUrl) {
    const response = await fetch(fileUrl);
    buffer = Buffer.from(await response.arrayBuffer());
  }

  if (buffer) {
    const asset = await uploadFile(buffer, fileName, mimeType || 'application/octet-stream');
    await whatsappLead.addLeadDocument({
      leadId,
      fileUrl: asset.url,
      fileAssetId: asset.assetId,
      fileName,
      mimeType: mimeType || 'application/octet-stream',
      fileSize: asset.size,
    });
  }

  await whatsappMessage.createWhatsappMessage({
    leadId,
    direction: 'incoming',
    content: `Documento enviado: ${fileName}`,
    sender: 'client',
    timestamp: new Date().toISOString(),
    mediaType: mimeType,
    fileName,
  });

  await whatsappLead.touchLeadIncomingMessage(leadId);

  triggerEvent('whatsapp:message', {});

  return NextResponse.json({ success: true, leadId }, { status: 201 });
}
