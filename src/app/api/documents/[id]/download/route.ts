import { NextRequest, NextResponse } from 'next/server';
import { caseDocument } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import { proxyStoredAsset } from '@/lib/files/proxyStoredAsset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const file = await caseDocument.getCaseDocumentAssetRow(id);
  if (!file) return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
  const access = await requireCaseAccess(request, file.caseId);
  if (access.response) return access.response;
  if (!access.actor.allRoles && !['comercial_juridico', 'junta', 'perito_interno', 'perito', 'cliente'].includes(access.actor.role)) {
    return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
  }
  if (['perito', 'perito_interno'].includes(access.actor.role) && file.category === 'pago') {
    return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
  }
  if (access.actor.role === 'cliente' && (!file.isVisibleToClient || file.category === 'dictamen_final')) {
    return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
  }
  return proxyStoredAsset(file);
}
