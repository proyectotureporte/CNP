import { NextRequest, NextResponse } from 'next/server';
import { caseMessage, documentRequest } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import { notifyUsers } from '@/lib/notify';
import { sendInternalAlertEmail } from '@/lib/email';
import { logCaseEvent } from '@/lib/sanity/logEvent';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireCaseAccess(request, id);
  if (access.response) return access.response;
  if (!access.actor.allRoles && !['comercial_juridico', 'perito_interno', 'perito'].includes(access.actor.role)) {
    return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
  }
  const data = await documentRequest.listDocumentRequests(id);
  return NextResponse.json({ success: true, data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!access.actor.allRoles && !['perito_interno', 'perito'].includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Solo el perito puede solicitar documentación por esta acción' }, { status: 403 });
    }
    if (!access.row.assignedJuridicoId) {
      return NextResponse.json({ success: false, error: 'El caso aún no tiene un Comercial Jurídico asignado' }, { status: 409 });
    }

    const body = await request.json();
    const description = String(body.description || '').trim();
    if (description.length < 5 || description.length > 2000) {
      return NextResponse.json({ success: false, error: 'Describe la documentación requerida (5–2000 caracteres)' }, { status: 400 });
    }

    const created = await documentRequest.createDocumentRequestWithMessage({
      caseId: id,
      requestedById: access.actor.userId,
      requestedByName: access.actor.displayName,
      assignedJuridicoId: access.row.assignedJuridicoId,
      description,
    });

    try {
      const recipients = await caseMessage.listMessageRecipients(id, 'juridico_perito', access.actor.role);
      await notifyUsers({
        userIds: recipients.map((recipient) => recipient.userId),
        title: 'El perito solicita documentación',
        message: description,
        priority: 'alta',
        linkUrl: `/crm/cases/${id}?tab=documents`,
      });
      await Promise.allSettled(recipients.filter((recipient) => recipient.email).map((recipient) =>
        sendInternalAlertEmail({
          to: recipient.email!,
          subject: 'Solicitud de documentación del perito',
          message: description,
          linkUrl: `/crm/cases/${id}?tab=documents`,
        }),
      ));
    } catch (notificationError) {
      console.error('[document-requests] notification error:', notificationError);
    }
    logCaseEvent({
      caseId: id,
      eventType: 'document_requested',
      description: 'El perito solicitó documentación al Comercial Jurídico asignado',
      userId: access.actor.userId,
      userName: access.actor.displayName,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('[document-requests] POST error:', error);
    return NextResponse.json({ success: false, error: 'Error solicitando documentación' }, { status: 500 });
  }
}
