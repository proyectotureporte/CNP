import { NextRequest, NextResponse } from 'next/server';
import { documentUploadLink } from '@/lib/db';
import { actorUserReference, requireCaseAccess } from '@/lib/auth/caseAccess';
import { canManageDocumentChecklist } from '@/lib/auth/permissions';
import { createDocumentUploadToken } from '@/lib/files/documentUploadToken';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { auditEntityChange } from '@/lib/audit';
import { caseDocument } from '@/lib/db';
import { getCaseClientContext, notifyCaseClient } from '@/lib/notifyClient';
import { DOCUMENT_CATEGORY_LABELS } from '@/lib/types';

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
    const notifyClient = body.notifyClient === true;
    const extraMessage = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';
    if (notifyClient) {
      const context = await getCaseClientContext(id);
      if (!context?.clientEmail?.includes('@')) {
        return NextResponse.json(
          { success: false, error: 'El cliente no tiene correo registrado; agrégalo en su ficha o copia el enlace manualmente' },
          { status: 409 },
        );
      }
    }
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
      title: notifyClient ? 'Solicitud de documentos enviada al cliente' : 'Enlace de carga documental generado',
      description: `Enlace seguro de carga documental generado (vence ${expiresAt.toLocaleDateString('es-CO')})${notifyClient ? ' y enviado por correo al cliente' : ''}`,
      userId: access.actor.userId,
      userName: access.actor.displayName,
    });
    auditEntityChange({
      request, action: 'create', entityType: 'client_document_upload_link', entityId: token.id, caseId: id,
      after: { expiresAt: expiresAt.toISOString(), enviadoAlCliente: notifyClient },
    });

    let emailed = false;
    if (notifyClient) {
      const pending = await caseDocument.listClientPendingDocuments(id);
      const highlights = pending.map((item) =>
        `${item.description} (${DOCUMENT_CATEGORY_LABELS[item.category] || item.category})${item.reason === 'correccion' ? ' — versión corregida' : ''}`,
      );
      await notifyCaseClient({
        caseId: id,
        title: 'Te solicitamos documentos para tu caso',
        message: pending.length
          ? `Para continuar necesitamos: ${pending.map((item) => item.description).join(', ')}.`
          : 'Te enviamos un enlace seguro para que nos compartas la documentación de tu caso.',
        type: 'warning',
        priority: 'alta',
        portalPath: `/portal/cases/${id}?tab=documents`,
        email: {
          subject: 'Para continuar necesitamos tu documentación',
          body: [
            extraMessage,
            `Puedes enviarnos los archivos de forma segura desde el siguiente enlace, sin necesidad de usuario ni contraseña. El enlace vence el ${expiresAt.toLocaleDateString('es-CO')}.`,
            pending.length ? 'Documentos que necesitamos:' : '',
          ].filter(Boolean).join('\n\n'),
          highlights,
          ctaLabel: 'Enviar mis documentos',
          ctaUrl: url,
        },
      });
      emailed = true;
    }

    return NextResponse.json({ success: true, data: { ...status, url, emailed } }, { status: 201 });
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
      title: 'Enlace de carga documental revocado',
      description: 'Enlace seguro de carga documental revocado',
      isVisibleToClient: false,
      userId: access.actor.userId,
      userName: access.actor.displayName,
    });
    auditEntityChange({
      request, action: 'delete', entityType: 'client_document_upload_link', entityId: id, caseId: id,
      before: { enlaceRevocado: true },
    });
    return NextResponse.json({ success: true, data: { message: 'Enlace revocado' } });
  } catch (error) {
    console.error('[document-upload-link] DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Error revocando el enlace' }, { status: 500 });
  }
}
