import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getWhatsappLeadByIdQuery } from '@/lib/sanity/queries';
import { triggerEvent } from '@/lib/pusher/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await client.fetch(getWhatsappLeadByIdQuery, { id });

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (err) {
    console.error('[whatsapp/leads/id] GET error:', err);
    return NextResponse.json({ success: false, error: 'Error obteniendo lead' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, unreadCount } = body;

    const patch = writeClient.patch(id);

    if (status !== undefined) patch.set({ status });
    if (notes !== undefined) patch.set({ notes });
    if (unreadCount !== undefined) patch.set({ unreadCount });

    const updated = await patch.commit();

    triggerEvent('whatsapp:lead', { id });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('[whatsapp/leads/id] PATCH error:', err);
    return NextResponse.json({ success: false, error: 'Error actualizando lead' }, { status: 500 });
  }
}
