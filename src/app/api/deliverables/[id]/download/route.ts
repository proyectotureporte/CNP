import { NextRequest, NextResponse } from 'next/server';
import { deliverable } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import { proxyStoredAsset } from '@/lib/files/proxyStoredAsset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const file = await deliverable.getDeliverableAccessRow(id);
  if (!file) return NextResponse.json({ success: false, error: 'Entrega no encontrada' }, { status: 404 });
  const access = await requireCaseAccess(request, file.caseId);
  if (access.response) return access.response;
  if (access.actor.role === 'cliente' && file.status !== 'aprobado') {
    return NextResponse.json({ success: false, error: 'Entrega no encontrada' }, { status: 404 });
  }
  return proxyStoredAsset(file);
}
