import { NextRequest, NextResponse } from 'next/server';
import { writeClient, client } from '@/lib/sanity/client';
import { getWhatsappLeadByPhoneQuery } from '@/lib/sanity/queries';
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

    if (type === 'message') {
      return handleMessage(body);
    } else if (type === 'complete') {
      return handleComplete(body);
    } else if (type === 'document') {
      return handleDocument(request, body);
    }

    return NextResponse.json({ success: false, error: 'Tipo no válido' }, { status: 400 });
  } catch (err) {
    console.error('[whatsapp/webhook] Error:', err);
    return NextResponse.json({ success: false, error: 'Error procesando webhook' }, { status: 500 });
  }
}

async function findOrCreateLead(phone: string) {
  const existing = await client.fetch<{ _id: string; status: string } | null>(
    getWhatsappLeadByPhoneQuery,
    { phone }
  );

  if (existing) return existing._id;

  const lead = await writeClient.create({
    _type: 'whatsappLead',
    phone,
    name: '',
    city: '',
    motive: '',
    brand: 'Peritus',
    status: 'nuevo',
    aiCompleted: false,
    unreadCount: 0,
    lastMessageAt: new Date().toISOString(),
  });

  return lead._id;
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

  const leadId = await findOrCreateLead(phone);
  const now = new Date().toISOString();

  // Save message
  await writeClient.create({
    _type: 'whatsappMessage',
    lead: { _type: 'reference', _ref: leadId },
    direction,
    content,
    sender: sender || (direction === 'incoming' ? 'client' : 'ai'),
    timestamp: now,
  });

  // Update lead
  const patch = writeClient.patch(leadId).set({ lastMessageAt: now });
  if (direction === 'incoming') {
    patch.inc({ unreadCount: 1 });
    patch.set({ status: 'en_conversacion' });
  }
  await patch.commit();

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

  const leadId = await findOrCreateLead(phone);

  // Determine brand based on observacion (CNP: "Sí" = financial)
  const isCNP = observacion?.toLowerCase().includes('s') && observacion?.toLowerCase() !== 'no' && observacion?.toLowerCase() !== 'no aplica';
  const brand = isCNP ? 'CNP' : 'Peritus';

  await writeClient.patch(leadId).set({
    name: nombre || '',
    city: ciudad || '',
    motive: motivo || '',
    brand,
    status: 'completado',
    aiCompleted: true,
    aiSummary: mensaje || '',
    lastMessageAt: new Date().toISOString(),
  }).commit();

  triggerEvent('whatsapp:message', {});

  return NextResponse.json({ success: true, leadId, brand }, { status: 200 });
}

async function handleDocument(request: NextRequest, body: {
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

  const leadId = await findOrCreateLead(phone);

  let assetRef: string | undefined;

  if (fileBase64) {
    // Upload base64 file to Sanity
    const buffer = Buffer.from(fileBase64, 'base64');
    const asset = await writeClient.assets.upload('file', buffer, {
      filename: fileName,
      contentType: mimeType || 'application/octet-stream',
    });
    assetRef = asset._id;
  } else if (fileUrl) {
    // Download from URL and upload to Sanity
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const asset = await writeClient.assets.upload('file', buffer, {
      filename: fileName,
      contentType: mimeType || 'application/octet-stream',
    });
    assetRef = asset._id;
  }

  if (assetRef) {
    await writeClient.patch(leadId).setIfMissing({ documents: [] }).append('documents', [{
      _key: crypto.randomUUID().replace(/-/g, '').slice(0, 12),
      fileName,
      mimeType: mimeType || 'application/octet-stream',
      file: { _type: 'file', asset: { _type: 'reference', _ref: assetRef } },
    }]).commit();
  }

  // Also save as a message for the conversation
  await writeClient.create({
    _type: 'whatsappMessage',
    lead: { _type: 'reference', _ref: leadId },
    direction: 'incoming',
    content: `Documento enviado: ${fileName}`,
    sender: 'client',
    timestamp: new Date().toISOString(),
    mediaType: mimeType,
    fileName,
  });

  await writeClient.patch(leadId).set({ lastMessageAt: new Date().toISOString() }).inc({ unreadCount: 1 }).commit();

  triggerEvent('whatsapp:message', {});

  return NextResponse.json({ success: true, leadId }, { status: 201 });
}
