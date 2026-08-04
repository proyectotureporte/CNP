import { NextRequest, NextResponse } from 'next/server';
import { caseMessage } from '@/lib/db';
import { canUseMessageAudience, requireCaseAccess } from '@/lib/auth/caseAccess';
import { proxyStoredAsset } from '@/lib/files/proxyStoredAsset';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const attachment = await caseMessage.getMessageAttachment(id);
  if (!attachment) {
    return NextResponse.json({ success: false, error: 'Adjunto no encontrado' }, { status: 404 });
  }
  const access = await requireCaseAccess(request, attachment.caseId);
  if (access.response) return access.response;
  if (access.actor.role === 'juridico' && access.row.assignedJuridicoId !== access.actor.userId) {
    return NextResponse.json({ success: false, error: 'Adjunto no encontrado' }, { status: 404 });
  }
  if (!canUseMessageAudience(access.actor, attachment.audience)) {
    return NextResponse.json({ success: false, error: 'Adjunto no encontrado' }, { status: 404 });
  }
  return proxyStoredAsset(attachment);
}
