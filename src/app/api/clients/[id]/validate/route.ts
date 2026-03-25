import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { triggerEvent } from '@/lib/pusher/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, notes } = body;

    if (!action || !['aprobado', 'denegado'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Accion debe ser "aprobado" o "denegado"' },
        { status: 400 }
      );
    }

    if (action === 'denegado' && !notes) {
      return NextResponse.json(
        { success: false, error: 'Las notas son requeridas para denegar' },
        { status: 400 }
      );
    }

    const registro = await client.fetch<{ _id: string } | null>(
      `*[_type == "registroPeritus" && clientRef._ref == $id][0]{ _id }`,
      { id }
    );

    if (!registro) {
      return NextResponse.json(
        { success: false, error: 'Registro Peritus no encontrado para este cliente' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = { estadoDocumentacion: action };
    if (notes) updateData.notasValidacion = notes;

    await writeClient.patch(registro._id).set(updateData).commit();
    triggerEvent('client:updated', { id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error validando cliente Peritus' },
      { status: 500 }
    );
  }
}
