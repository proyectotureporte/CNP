import { NextRequest, NextResponse } from 'next/server';
import { expert } from '@/lib/db';
import { actorFromRequest } from '@/lib/auth/caseAccess';
import { listDocumentsResponse, uploadDocumentFromForm } from '@/lib/peritos/documentos';
import { triggerEvent } from '@/lib/realtime/server';

/** El perito solo gestiona la documentación de su propio perfil. */
async function ownExpert(request: NextRequest) {
  const actor = actorFromRequest(request);
  if (!actor || actor.role !== 'perito') return null;
  const profile = await expert.getExpertByUserId(actor.userId);
  return profile ? { actor, expertId: profile._id } : null;
}

export async function GET(request: NextRequest) {
  try {
    const own = await ownExpert(request);
    if (!own) return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    return listDocumentsResponse(own.expertId, '/api/expert/profile/documents');
  } catch (error) {
    console.error('[expert-profile-documents] GET error:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo documentos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const own = await ownExpert(request);
    if (!own) return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    const response = await uploadDocumentFromForm(own.expertId, await request.formData(), own.actor.userId);
    if (response.ok) triggerEvent('expert:updated', { id: own.expertId });
    return response;
  } catch (error) {
    console.error('[expert-profile-documents] POST error:', error);
    return NextResponse.json({ success: false, error: 'Error subiendo el documento' }, { status: 500 });
  }
}
