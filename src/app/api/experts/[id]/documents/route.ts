import { NextRequest, NextResponse } from 'next/server';
import { expert } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { canManageExperts, hasPermission } from '@/lib/auth/permissions';
import { actorFromRequest, actorUserReference } from '@/lib/auth/caseAccess';
import { listDocumentsResponse, uploadDocumentFromForm } from '@/lib/peritos/documentos';
import { triggerEvent } from '@/lib/realtime/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const stop = guardRole(request, (role) => hasPermission(role, 'experts'));
    if (stop) return stop;
    const { id } = await params;
    if (!(await expert.getExpertById(id))) {
      return NextResponse.json({ success: false, error: 'Perito no encontrado' }, { status: 404 });
    }
    return listDocumentsResponse(id, `/api/experts/${id}/documents`);
  } catch (error) {
    console.error('[expert-documents] GET error:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo documentos' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const stop = guardRole(request, canManageExperts);
    if (stop) return stop;
    const actor = actorFromRequest(request);
    const { id } = await params;
    if (!(await expert.getExpertById(id))) {
      return NextResponse.json({ success: false, error: 'Perito no encontrado' }, { status: 404 });
    }
    const response = await uploadDocumentFromForm(id, await request.formData(), actor ? actorUserReference(actor) : null);
    if (response.ok) triggerEvent('expert:updated', { id });
    return response;
  } catch (error) {
    console.error('[expert-documents] POST error:', error);
    return NextResponse.json({ success: false, error: 'Error subiendo el documento' }, { status: 500 });
  }
}
