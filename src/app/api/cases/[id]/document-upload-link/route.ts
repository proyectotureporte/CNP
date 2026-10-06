import { NextRequest, NextResponse } from 'next/server';
import { documentUploadLink } from '@/lib/db';
import { actorUserReference, requireCaseAccess } from '@/lib/auth/caseAccess';
import { canManageDocumentChecklist } from '@/lib/auth/permissions';
import { createDocumentUploadToken } from '@/lib/files/documentUploadToken';
import { logCaseEvent } from '@/lib/sanity/logEvent';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireCaseAccess(request, id);
  if (access.response) return access.response;
  if (!canManageDocumentChecklist(access.actor.role, access.actor.allRoles)) {
    return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
  }
  const status = await documentUploadLink.getLinkStatus(id);
  return NextResponse.json({ success: true, data: status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!canManageDocumentChecklist(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    if (!access.row.clientId) {
      return NextResponse.json(
        { success: false, error: 'Asigna un cliente al caso antes de generar el enlace' },
        { status: 409 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const expiresInDays = Number(body.expiresInDays ?? 30);
    if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 90) {
      return NextResponse.json(
        { success: false, error: 'El vencimiento debe estar entre 1 y 90 días' },
        { status: 400 },
      );
    }

    const token = createDocumentUploadToken();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    const status = await documentUploadLink.createLink({
      id: token.id,
      caseId: id,
      clientId: access.row.clientId,
      tokenHash: token.tokenHash,
      createdById: actorUserReference(access.actor),
      expiresAt,
    });
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
    const origin = configuredOrigin || request.nextUrl.origin;
    const url = `${origin}/cargar-documentos/acceso/${token.credential}`;

    await logCaseEvent({
      caseId: id,
      eventType: 'document_requested',
      description: `Enlace seguro de carga documental generado (vence ${expiresAt.toLocaleDateString('es-CO')})`,
      userId: access.actor.userId,
      userName: access.actor.displayName,
    });

    return NextResponse.json({ success: true, data: { ...status, url } }, { status: 201 });
  } catch (error) {
    console.error('[document-upload-link] POST error:', error);
    return NextResponse.json({ success: false, error: 'Error generando el enlace de carga' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!canManageDocumentChecklist(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    await documentUploadLink.revokeLink(id);
    await logCaseEvent({
      caseId: id,
      eventType: 'document_requested',
      description: 'Enlace seguro de carga documental revocado',
      userId: access.actor.userId,
      userName: access.actor.displayName,
    });
    return NextResponse.json({ success: true, data: { message: 'Enlace revocado' } });
  } catch (error) {
    console.error('[document-upload-link] DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Error revocando el enlace' }, { status: 500 });
  }
}
