import { NextRequest, NextResponse } from 'next/server';
import { guardRole } from '@/lib/auth/guard';
import { canManageExperts, hasPermission } from '@/lib/auth/permissions';
import { downloadDocument, removeDocument } from '@/lib/peritos/documentos';
import { triggerEvent } from '@/lib/realtime/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const stop = guardRole(request, (role) => hasPermission(role, 'experts'));
  if (stop) return stop;
  const { id, docId } = await params;
  return downloadDocument(id, docId, request.nextUrl.searchParams.get('inline') === '1');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  try {
    const stop = guardRole(request, canManageExperts);
    if (stop) return stop;
    const { id, docId } = await params;
    const response = await removeDocument(id, docId);
    if (response.ok) triggerEvent('expert:updated', { id });
    return response;
  } catch (error) {
    console.error('[expert-documents] DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Error eliminando el documento' }, { status: 500 });
  }
}
