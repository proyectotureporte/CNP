import { NextRequest, NextResponse } from 'next/server';
import { caseDocument } from '@/lib/db';
import type { DocumentCategory } from '@/lib/types';
import { triggerEvent } from '@/lib/pusher/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await caseDocument.getCaseDocumentById(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: doc });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo documento' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await caseDocument.getCaseDocumentById(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    }
    await caseDocument.deleteCaseDocument(id);
    triggerEvent('document:deleted', { id });
    return NextResponse.json({ success: true, data: { message: 'Documento eliminado' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error eliminando documento' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const doc = await caseDocument.getCaseDocumentById(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    }

    const updated = await caseDocument.updateCaseDocument(id, {
      isVisibleToClient: body.isVisibleToClient,
      description: body.description,
      category: body.category as DocumentCategory | undefined,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando documento' }, { status: 500 });
  }
}
