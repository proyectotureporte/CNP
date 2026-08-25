import { NextRequest, NextResponse } from 'next/server';
import { caseMessage } from '@/lib/db';
import { requireCaseAccess, canUseMessageAudience } from '@/lib/auth/caseAccess';
import { uploadFile } from '@/lib/sanity/assets';
import { notifyUsers } from '@/lib/notify';
import { sendInternalAlertEmail } from '@/lib/email';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import type { CaseMessageAudience } from '@/lib/types';
import { triggerEvent } from '@/lib/realtime/server';

const AUDIENCES: CaseMessageAudience[] = ['juridico_perito', 'juridico_cliente'];
const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024;

function audienceForRequest(
  requested: string | null,
  role: string,
): CaseMessageAudience | null {
  if (role === 'perito') return 'juridico_perito';
  if (role === 'cliente') return 'juridico_cliente';
  return AUDIENCES.includes(requested as CaseMessageAudience)
    ? requested as CaseMessageAudience
    : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (['perito', 'cliente'].includes(access.actor.role) && !access.row.assignedJuridicoId) {
      return NextResponse.json({ success: false, error: 'El caso aún no tiene un Comercial Jurídico asignado' }, { status: 409 });
    }
    if (access.actor.role === 'comercial_juridico' && access.row.assignedJuridicoId !== access.actor.userId) {
      return NextResponse.json({ success: false, error: 'Este hilo corresponde al Comercial Jurídico asignado al caso' }, { status: 403 });
    }

    const audience = audienceForRequest(
      request.nextUrl.searchParams.get('audience'),
      access.actor.role,
    );
    if (!audience || !canUseMessageAudience(access.actor, audience)) {
      return NextResponse.json({ success: false, error: 'Hilo no permitido' }, { status: 403 });
    }

    const messages = await caseMessage.listCaseMessages(id, audience);
    return NextResponse.json({
      success: true,
      data: messages.map((item) => ({
        ...item,
        ...(item.attachmentName
          ? { attachmentDownloadUrl: `/api/case-messages/${item._id}/attachment` }
          : {}),
      })),
    });
  } catch (error) {
    console.error('[case-messages] GET error:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo mensajes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (access.actor.allRoles) {
      return NextResponse.json({ success: false, error: 'El acceso total permite supervisar los hilos, no suplantar a sus participantes' }, { status: 403 });
    }
    if (['perito', 'cliente'].includes(access.actor.role) && !access.row.assignedJuridicoId) {
      return NextResponse.json({ success: false, error: 'El caso aún no tiene un Comercial Jurídico asignado' }, { status: 409 });
    }
    if (access.actor.role === 'comercial_juridico' && access.row.assignedJuridicoId !== access.actor.userId) {
      return NextResponse.json({ success: false, error: 'Este hilo corresponde al Comercial Jurídico asignado al caso' }, { status: 403 });
    }

    const form = await request.formData();
    const audience = audienceForRequest(String(form.get('audience') || ''), access.actor.role);
    const body = String(form.get('body') || '').trim();
    const attachment = form.get('attachment');

    if (!audience || !canUseMessageAudience(access.actor, audience)) {
      return NextResponse.json({ success: false, error: 'Hilo no permitido' }, { status: 403 });
    }
    if (!body || body.length > 5000) {
      return NextResponse.json({ success: false, error: 'El mensaje debe tener entre 1 y 5000 caracteres' }, { status: 400 });
    }

    let uploaded: Awaited<ReturnType<typeof uploadFile>> | null = null;
    if (attachment instanceof File && attachment.size > 0) {
      if (attachment.size > MAX_ATTACHMENT_SIZE) {
        return NextResponse.json({ success: false, error: 'El adjunto supera 15 MB' }, { status: 400 });
      }
      uploaded = await uploadFile(
        Buffer.from(await attachment.arrayBuffer()),
        attachment.name,
        attachment.type || 'application/octet-stream',
      );
    }

    const created = await caseMessage.createCaseMessage({
      caseId: id,
      audience,
      senderId: access.actor.userId,
      senderName: access.actor.displayName,
      senderRole: access.actor.role,
      body,
      attachmentUrl: uploaded?.url,
      attachmentAssetId: uploaded?.assetId,
      attachmentName: uploaded?.originalFilename,
      attachmentMimeType: uploaded?.mimeType,
      attachmentSize: uploaded?.size,
    });

    const recipients = await caseMessage.listMessageRecipients(id, audience, access.actor.role);
    const linkUrl = access.actor.role === 'cliente'
      ? `/crm/cases/${id}?tab=messages`
      : access.actor.role === 'perito'
        ? `/crm/cases/${id}?tab=messages`
        : audience === 'juridico_cliente'
          ? `/portal/cases/${id}?tab=messages`
          : `/crm/cases/${id}?tab=messages`;

    await notifyUsers({
      userIds: recipients.map((recipient) => recipient.userId),
      title: 'Nuevo mensaje en un caso',
      message: `${access.actor.displayName}: ${body.slice(0, 180)}`,
      linkUrl,
      priority: 'normal',
    });
    await Promise.allSettled(
      recipients
        .filter((recipient) => Boolean(recipient.email))
        .map((recipient) => sendInternalAlertEmail({
          to: recipient.email!,
          subject: 'Nuevo mensaje en tu caso — CNP | Peritus',
          message: `${access.actor.displayName} envió un mensaje: ${body.slice(0, 500)}`,
          linkUrl,
        })),
    );

    logCaseEvent({
      caseId: id,
      eventType: 'message_sent',
      description: `Mensaje enviado en el hilo ${audience === 'juridico_perito' ? 'comercial–perito' : 'comercial–cliente final'}`,
      userId: access.actor.userId,
      userName: access.actor.displayName,
    });
    triggerEvent('message:created', { caseId: id, audience });

    return NextResponse.json({
      success: true,
      data: created && {
        ...created,
        ...(created.attachmentName
          ? { attachmentDownloadUrl: `/api/case-messages/${created._id}/attachment` }
          : {}),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[case-messages] POST error:', error);
    return NextResponse.json({ success: false, error: 'Error enviando mensaje' }, { status: 500 });
  }
}
