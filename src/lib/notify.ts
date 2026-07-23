import { notification, crmUser, systemSetting } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { sendInternalAlertEmail } from '@/lib/email';
import type { NotificationType, NotificationPriority } from '@/lib/types';

// Punto ÚNICO para notificar a usuarios internos (RF-13):
//   * persiste la notificación,
//   * la empuja por WebSocket ('notification:new' — antes nunca se emitía),
//   * y opcionalmente la envía al buzón configurado por tipo (item 17).

/** Buzones configurables en system_setting (admin → Configuración). */
export type Mailbox = 'admin' | 'comite' | 'comunicaciones';

export interface NotifyInput {
  userIds: Iterable<string | null | undefined>;
  title: string;
  message?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  linkUrl?: string;
  /** Además de la alerta interna, enviar correo al buzón configurado. */
  mailbox?: Mailbox;
}

export async function notifyUsers(input: NotifyInput): Promise<void> {
  const ids = [...new Set([...input.userIds].filter((v): v is string => Boolean(v)))];

  await Promise.all(
    ids.map(async (userId) => {
      try {
        const id = await notification.createNotification({
          userId,
          type: input.type ?? 'info',
          priority: input.priority ?? 'normal',
          title: input.title,
          message: input.message ?? null,
          linkUrl: input.linkUrl ?? null,
        });
        triggerEvent('notification:new', { id, userId, title: input.title });
      } catch (err) {
        console.error('[notify] Error creando notificación:', err);
      }
    }),
  );

  if (input.mailbox) {
    // No bloquear la respuesta por el correo.
    sendMailboxEmail(input.mailbox, input.title, input.message, input.linkUrl).catch((err) =>
      console.error('[notify] Error enviando correo de buzón:', err),
    );
  }
}

/** Notifica a los usuarios dados MÁS todos los admins (dedup incluido). */
export async function notifyUsersAndAdmins(input: NotifyInput): Promise<void> {
  let adminIds: string[] = [];
  try {
    adminIds = await crmUser.listAdminUserIds();
  } catch (err) {
    console.error('[notify] Error listando admins:', err);
  }
  await notifyUsers({ ...input, userIds: [...input.userIds, ...adminIds] });
}

/** Correo al buzón configurado por tipo (email_admin / email_comite / email_comunicaciones). */
export async function sendMailboxEmail(
  mailbox: Mailbox,
  subject: string,
  message?: string,
  linkUrl?: string,
): Promise<void> {
  const setting = await systemSetting.getSystemSetting(`email_${mailbox}`);
  const to = setting?.value?.trim();
  if (!to) return; // buzón sin configurar: solo alerta interna
  await sendInternalAlertEmail({ to, subject, message: message ?? subject, linkUrl });
}
