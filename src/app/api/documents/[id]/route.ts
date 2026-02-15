import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getCaseDocumentByIdQuery } from '@/lib/sanity/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await client.fetch(getCaseDocumentByIdQuery, { id });

    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: doc });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo documento' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await client.fetch(getCaseDocumentByIdQuery, { id });

    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    await writeClient.delete(id);
    return NextResponse.json({ success: true, data: { message: 'Documento eliminado' } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error eliminando documento' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const doc = await client.fetch(getCaseDocumentByIdQuery, { id });
    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (body.isVisibleToClient !== undefined) updates.isVisibleToClient = body.isVisibleToClient;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;

    const updated = await writeClient.patch(id).set(updates).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando documento' },
      { status: 500 }
    );
  }
}
