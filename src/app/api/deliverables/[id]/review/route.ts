import { NextRequest, NextResponse } from 'next/server';
import { caseMessage, deliverable } from '@/lib/db';
import type { DeliverableStatus } from '@/lib/types';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import { canReviewDeliverable } from '@/lib/auth/permissions';
import { notifyUsers } from '@/lib/notify';
import { sendInternalAlertEmail } from '@/lib/email';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { triggerEvent } from '@/lib/realtime/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const row = await deliverable.getDeliverableAccessRow(id);
    if (!row) {
      return NextResponse.json({ success: false, error: 'Entrega no encontrada' }, { status: 404 });
    }
    const access = await requireCaseAccess(request, row.caseId);
    if (access.response) return access.response;
    if (!canReviewDeliverable(access.actor.role, access.actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    if (!['enviado', 'en_revision'].includes(row.status)) {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden revisar dictámenes enviados o en revisión' },
        { status: 409 },
      );
    }

    const body = await request.json();
    const action = String(body.action || '') as DeliverableStatus;
    const rejectionReason = String(body.rejectionReason || '').trim();
    if (action !== 'aprobado' && action !== 'rechazado') {
      return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });
    }
    if (action === 'rechazado' && rejectionReason.length < 5) {
      return NextResponse.json({ success: false, error: 'Debes indicar un comentario de devolución de al menos 5 caracteres' }, { status: 400 });
    }

    const message = action === 'rechazado'
      ? `El dictamen fue devuelto para corrección. Comentario obligatorio: ${rejectionReason}`
      : 'El dictamen fue aprobado por el área jurídica y ya está disponible para el cliente final.';
    const audience = action === 'rechazado' ? 'juridico_perito' : 'juridico_cliente';
    const updated = await deliverable.reviewDeliverableWithMessage({
      id,
      caseId: row.caseId,
      status: action,
      rejectionReason,
      reviewerId: access.actor.userId,
      senderName: access.actor.displayName,
      senderRole: access.actor.role,
      audience,
      message,
    });

    try {
      if (action === 'rechazado') {
        const recipients = await caseMessage.listMessageRecipients(row.caseId, 'juridico_perito', access.actor.role);
        await notifyUsers({
          userIds: recipients.map((recipient) => recipient.userId),
          title: 'Dictamen devuelto para corrección',
          message: rejectionReason,
          priority: 'alta',
          linkUrl: `/crm/cases/${row.caseId}?tab=deliverables`,
        });
        await Promise.allSettled(recipients.filter((recipient) => recipient.email).map((recipient) =>
          sendInternalAlertEmail({
            to: recipient.email!,
            subject: 'Dictamen devuelto para corrección',
            message,
            linkUrl: `/crm/cases/${row.caseId}?tab=deliverables`,
          }),
        ));
        logCaseEvent({
          caseId: row.caseId,
          eventType: 'deliverable_rejected',
          description: `Dictamen devuelto: ${rejectionReason}`,
          userId: access.actor.userId,
          userName: access.actor.displayName,
        });
      } else {
        const recipients = await caseMessage.listMessageRecipients(row.caseId, 'juridico_cliente', access.actor.role);
        await notifyUsers({
          userIds: recipients.map((recipient) => recipient.userId),
          title: 'Dictamen aprobado y disponible',
          message,
          priority: 'alta',
          linkUrl: `/portal/cases/${row.caseId}?tab=deliverables`,
        });
        await Promise.allSettled(recipients.filter((recipient) => recipient.email).map((recipient) =>
          sendInternalAlertEmail({
            to: recipient.email!,
            subject: 'Tu dictamen ya está disponible',
            message,
            linkUrl: `/portal/cases/${row.caseId}?tab=deliverables`,
          }),
        ));
        logCaseEvent({
          caseId: row.caseId,
          eventType: 'deliverable_approved',
          description: 'Dictamen aprobado y liberado al portal del cliente final',
          userId: access.actor.userId,
          userName: access.actor.displayName,
        });
      }
    } catch (notificationError) {
      // La revisión y el mensaje ya quedaron confirmados en una transacción.
      // Un fallo transitorio de correo/notificaciones no debe inducir al cliente
      // a repetir una operación que ya cambió el estado del dictamen.
      console.error('[deliverable-review] notification error:', notificationError);
    }

    triggerEvent('deliverable:reviewed', { id, caseId: row.caseId, status: action });
    return NextResponse.json({
      success: true,
      data: updated ? { ...updated, fileUrl: undefined, downloadUrl: `/api/deliverables/${id}/download` } : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'DELIVERABLE_STATE_CONFLICT') {
      return NextResponse.json(
        { success: false, error: 'El dictamen ya fue revisado por otro usuario' },
        { status: 409 },
      );
    }
    console.error('[deliverable-review] error:', error);
    return NextResponse.json({ success: false, error: 'Error revisando entrega' }, { status: 500 });
  }
}
