import { NextRequest, NextResponse } from 'next/server';
import { commission } from '@/lib/db';
import { actorFromRequest, requireCaseAccess } from '@/lib/auth/caseAccess';
import { canAccessFinances } from '@/lib/auth/permissions';
import { proxyStoredAsset } from '@/lib/files/proxyStoredAsset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const actor = actorFromRequest(request);
  const file = await commission.getCommissionAccessRow(id);
  if (!actor || !file) return NextResponse.json({ success: false, error: 'Comprobante no encontrado' }, { status: 404 });
  if (!canAccessFinances(actor.role, actor.allRoles)) {
    return NextResponse.json({ success: false, error: 'Comprobante no encontrado' }, { status: 404 });
  }
  if (file.caseId) {
    const access = await requireCaseAccess(request, file.caseId);
    if (access.response) return access.response;
  }
  return proxyStoredAsset(file);
}
