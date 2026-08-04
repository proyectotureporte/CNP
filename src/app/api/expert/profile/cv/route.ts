import { NextRequest, NextResponse } from 'next/server';
import { expert } from '@/lib/db';
import { actorFromRequest } from '@/lib/auth/caseAccess';
import { proxyStoredAsset } from '@/lib/files/proxyStoredAsset';

export async function GET(request: NextRequest) {
  const actor = actorFromRequest(request);
  if (!actor || actor.role !== 'perito') {
    return NextResponse.json({ success: false, error: 'Archivo no encontrado' }, { status: 404 });
  }
  const file = await expert.getExpertCvAssetByUserId(actor.userId);
  if (!file) return NextResponse.json({ success: false, error: 'Archivo no encontrado' }, { status: 404 });
  return proxyStoredAsset(file);
}
