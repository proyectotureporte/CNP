import { query, queryOne } from '@/lib/db';
import { notifyUsers } from '@/lib/notify';
import { sendClientCaseEmail } from '@/lib/email';
import { sendWhatsappText } from '@/lib/whatsapp';
import type { NotificationPriority, NotificationType } from '@/lib/types';

// Punto ÚNICO para avisar al CLIENTE de un caso y a los ABOGADOS que lo
// supervisan:
//   * notificación in-app a cada usuario del portal (cliente y abogados),
//   * correo al cliente (crm_client.email), a sus usuarios del portal y a los
//     abogados del caso,
//   * y WhatsApp al teléfono del cliente cuando el aviso lleva correo
//     (son los avisos importantes: documentos, actuaciones, estado).
// Nunca revela datos del perito ni información interna: el texto lo decide la
// ruta que llama, pensando en que lo lee el cliente final.

export interface ClientNotifyInput {
  caseId: string;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  /** Ruta del portal (relativa) a la que lleva la notificación. */
  portalPath?: string;
  /** Si se omite no se envía correo ni WhatsApp (solo aviso in-app). */
  email?: {
    subject: string;
    /** Texto principal; se escapa al construir el HTML. */
    body: string;
    /** Etiqueta del botón (por defecto "Abrir mi portal"). */
    ctaLabel?: string;
    /** URL absoluta del botón; por defecto el portal del caso. */
    ctaUrl?: string;
    /** Líneas destacadas en el recuadro (p. ej. documentos pendientes). */
    highlights?: string[];
  };
  /** Por defecto los abogados del caso reciben el mismo aviso; false para avisos solo del cliente. */
  includeLawyers?: boolean;
  /** Por defecto se envía WhatsApp al cliente cuando hay correo; false para omitirlo. */
  whatsapp?: boolean;
}

interface CaseClientRow {
  caseCode: string;
  caseTitle: string;
  brand: 'CNP' | 'Peritus';
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
}

export async function getCaseClientContext(caseId: string): Promise<CaseClientRow | null> {
  return queryOne<CaseClientRow>(
    `SELECT c.case_code AS "caseCode", c.title AS "caseTitle", c.brand,
       c.client_id AS "clientId", cl.name AS "clientName", cl.email AS "clientEmail", cl.phone AS "clientPhone"
     FROM cases c LEFT JOIN crm_client cl ON cl.id = c.client_id
     WHERE c.id = $1`,
    [caseId],
  );
}

/** Usuarios del portal (rol cliente, activos) vinculados a un crm_client. */
async function listPortalUsers(clientId: string, clientEmail: string | null) {
  return query<{ id: string; email: string | null; displayName: string | null }>(
    `SELECT id, email, display_name AS "displayName" FROM crm_user
     WHERE role = 'cliente' AND active = TRUE
       AND (client_id = $1 OR ($2 <> '' AND lower(email) = lower($2)))`,
    [clientId, clientEmail ?? ''],
  );
}

/** Abogados activos con acceso al caso. */
async function listCaseLawyers(caseId: string) {
  return query<{ id: string; email: string | null; displayName: string | null }>(
    `SELECT u.id, u.email, u.display_name AS "displayName"
     FROM case_lawyer cl JOIN crm_user u ON u.id = cl.user_id
     WHERE cl.case_id = $1 AND u.active = TRUE AND u.role = 'abogado'`,
    [caseId],
  );
}

export function portalCaseUrl(caseId: string, tab?: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://cnp.com.co').replace(/\/$/, '');
  return `${base}/portal/cases/${caseId}${tab ? `?tab=${tab}` : ''}`;
}

function uniqueEmails(values: Array<string | null | undefined>): string[] {
  return [...new Set(
    values.map((value) => value?.trim().toLowerCase()).filter((value): value is string => Boolean(value && value.includes('@'))),
  )];
}

export async function notifyCaseClient(input: ClientNotifyInput): Promise<void> {
  try {
    const context = await getCaseClientContext(input.caseId);
    if (!context) return;
    const clientUsers = context.clientId ? await listPortalUsers(context.clientId, context.clientEmail) : [];
    const lawyers = input.includeLawyers === false ? [] : await listCaseLawyers(input.caseId);

    await notifyUsers({
      userIds: [...clientUsers, ...lawyers].map((user) => user.id),
      title: input.title,
      message: input.message,
      type: input.type ?? 'info',
      priority: input.priority ?? 'normal',
      linkUrl: input.portalPath ?? `/portal/cases/${input.caseId}`,
    });

    if (!input.email) return;
    const ctaUrl = input.email.ctaUrl ?? portalCaseUrl(input.caseId);

    const clientRecipients = uniqueEmails([context.clientEmail, ...clientUsers.map((user) => user.email)]);
    if (clientRecipients.length > 0) {
      sendClientCaseEmail({
        to: clientRecipients,
        clientName: context.clientName || 'Cliente',
        caseCode: context.caseCode,
        caseTitle: context.caseTitle,
        subject: input.email.subject,
        body: input.email.body,
        highlights: input.email.highlights,
        ctaLabel: input.email.ctaLabel,
        ctaUrl,
      }).catch((err) => console.error('[notifyClient] Error enviando correo al cliente:', err));
    }

    // Cada abogado recibe su propio correo, dirigido a él y sin los datos de otros destinatarios.
    for (const lawyer of lawyers) {
      const [to] = uniqueEmails([lawyer.email]);
      if (!to) continue;
      sendClientCaseEmail({
        to,
        clientName: lawyer.displayName || 'Abogado',
        caseCode: context.caseCode,
        caseTitle: context.caseTitle,
        subject: input.email.subject,
        body: input.email.body,
        highlights: input.email.highlights,
        ctaLabel: input.email.ctaLabel,
        ctaUrl,
      }).catch((err) => console.error('[notifyClient] Error enviando correo al abogado:', err));
    }

    if (input.whatsapp !== false && context.clientPhone) {
      const lines = [
        `*${input.email.subject}* — ${context.caseCode}`,
        '',
        `Hola ${context.clientName || ''}`.trim() + ',',
        input.email.body,
        ...(input.email.highlights?.length ? ['', ...input.email.highlights.map((line) => `• ${line}`)] : []),
        '',
        `${input.email.ctaLabel || 'Abrir mi portal'}: ${ctaUrl}`,
        '',
        'CNP | Peritus',
      ];
      sendWhatsappText(context.clientPhone, lines.join('\n')).catch((err) =>
        console.error('[notifyClient] Error enviando WhatsApp al cliente:', err),
      );
    }
  } catch (err) {
    console.error('[notifyClient] Error notificando al cliente:', err);
  }
}
