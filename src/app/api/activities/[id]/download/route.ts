import { NextRequest, NextResponse } from 'next/server';
import { workPlanActivity } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import { proxyStoredAsset } from '@/lib/files/proxyStoredAsset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const file = await workPlanActivity.getActivityFileAccessRow(id);
  if (!file) {
    return NextResponse.json({ success: false, error: 'Archivo no encontrado' }, { status: 404 });
  }
  const access = await requireCaseAccess(request, file.caseId);
  if (access.response) return access.response;
  if (!access.actor.allRoles && !['comercial_juridico', 'perito_interno', 'perito'].includes(access.actor.role)) {
    return NextResponse.json({ success: false, error: 'Archivo no encontrado' }, { status: 404 });
  }
  return proxyStoredAsset(file);
}
