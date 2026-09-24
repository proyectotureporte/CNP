import { NextRequest, NextResponse } from 'next/server';
import { expert } from '@/lib/db';
import { actorFromRequest } from '@/lib/auth/caseAccess';
import { downloadDocument, removeDocument } from '@/lib/peritos/documentos';
import { triggerEvent } from '@/lib/realtime/server';

async function ownExpertId(request: NextRequest): Promise<string | null> {
  const actor = actorFromRequest(request);
  if (!actor || actor.role !== 'perito') return null;
  return (await expert.getExpertByUserId(actor.userId))?._id ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const expertId = await ownExpertId(request);
  if (!expertId) return NextResponse.json({ success: false, error: 'Archivo no encontrado' }, { status: 404 });
  const { docId } = await params;
  return downloadDocument(expertId, docId, request.nextUrl.searchParams.get('inline') === '1');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  try {
    const expertId = await ownExpertId(request);
    if (!expertId) return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    const { docId } = await params;
    // La hoja de vida es obligatoria: el perito la reemplaza, no la elimina.
    if (docId === 'cv') {
      return NextResponse.json({ success: false, error: 'La hoja de vida se reemplaza, no se elimina' }, { status: 400 });
    }
    const response = await removeDocument(expertId, docId);
    if (response.ok) triggerEvent('expert:updated', { id: expertId });
    return response;
  } catch (error) {
    console.error('[expert-profile-documents] DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Error eliminando el documento' }, { status: 500 });
  }
}
