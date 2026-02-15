import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listCaseDocumentsQuery, getCaseByIdQuery } from '@/lib/sanity/queries';
import { DOCUMENT_CATEGORIES, type DocumentCategory, type CaseExpanded } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';

    const documents = await client.fetch(listCaseDocumentsQuery, { caseId: id, category });
    return NextResponse.json({ success: true, data: documents });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo documentos' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');

    // Verify case exists
    const existing = await client.fetch<CaseExpanded | null>(getCaseByIdQuery, { id });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Caso no encontrado' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'otro';
    const description = (formData.get('description') as string) || '';
    const isVisibleToClient = formData.get('isVisibleToClient') === 'true';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Archivo requerido' },
        { status: 400 }
      );
    }

    if (!DOCUMENT_CATEGORIES.includes(category as DocumentCategory)) {
      return NextResponse.json(
        { success: false, error: 'Categoria no valida' },
        { status: 400 }
      );
    }

    // Max file size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'El archivo excede el limite de 10MB' },
        { status: 400 }
      );
    }

    // Upload file to Sanity assets
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await writeClient.assets.upload('file', buffer, {
      filename: file.name,
      contentType: file.type,
    });

    // Create document record
    const doc: { _type: 'caseDocument'; [key: string]: unknown } = {
      _type: 'caseDocument',
      case: { _type: 'reference', _ref: id },
      category,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      version: 1,
      isVisibleToClient,
      description,
      uploadedByName: userName || 'Sistema',
      file: {
        _type: 'file',
        asset: { _type: 'reference', _ref: asset._id },
      },
    };

    if (userId && userId !== 'admin') {
      doc.uploadedBy = { _type: 'reference', _ref: userId };
    }

    const created = await writeClient.create(doc);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error subiendo documento' },
      { status: 500 }
    );
  }
}
