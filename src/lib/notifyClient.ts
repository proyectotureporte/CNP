import { query, queryOne } from '@/lib/db';
import { notifyUsers } from '@/lib/notify';
import { sendClientCaseEmail } from '@/lib/email';
import type { NotificationPriority, NotificationType } from '@/lib/types';

// Punto ÚNICO para avisar al CLIENTE de un caso:
//   * notificación in-app a cada usuario del portal vinculado al cliente,
//   * y correo al cliente (crm_client.email) y a los usuarios del portal.
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
  /** Si se omite no se envía correo (solo aviso in-app). */
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
}

interface CaseClientRow {
  caseCode: string;
  caseTitle: string;
  brand: 'CNP' | 'Peritus';
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
}

export async function getCaseClientContext(caseId: string): Promise<CaseClientRow | null> {
  return queryOne<CaseClientRow>(
    `SELECT c.case_code AS "caseCode", c.title AS "caseTitle", c.brand,
       c.client_id AS "clientId", cl.name AS "clientName", cl.email AS "clientEmail"
     FROM cases c LEFT JOIN crm_client cl ON cl.id = c.client_id
     WHERE c.id = $1`,
    [caseId],
  );
}

/** Usuarios del portal (rol cliente, activos) vinculados a un crm_client. */
async function listPortalUsers(clientId: string, clientEmail: string | null) {
  return query<{ id: string; email: string | null }>(
    `SELECT id, email FROM crm_user
     WHERE role = 'cliente' AND active = TRUE
       AND (client_id = $1 OR ($2 <> '' AND lower(email) = lower($2)))`,
    [clientId, clientEmail ?? ''],
  );
}

export function portalCaseUrl(caseId: string, tab?: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://cnp.com.co').replace(/\/$/, '');
  return `${base}/portal/cases/${caseId}${tab ? `?tab=${tab}` : ''}`;
}

export async function notifyCaseClient(input: ClientNotifyInput): Promise<void> {
  try {
    const context = await getCaseClientContext(input.caseId);
    if (!context?.clientId) return;
    const users = await listPortalUsers(context.clientId, context.clientEmail);

    await notifyUsers({
      userIds: users.map((user) => user.id),
      title: input.title,
      message: input.message,
      type: input.type ?? 'info',
      priority: input.priority ?? 'normal',
      linkUrl: input.portalPath ?? `/portal/cases/${input.caseId}`,
    });

    if (!input.email) return;
    const recipients = [...new Set(
      [context.clientEmail, ...users.map((user) => user.email)]
        .map((value) => value?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value && value.includes('@'))),
    )];
    if (recipients.length === 0) return;

    sendClientCaseEmail({
      to: recipients,
      clientName: context.clientName || 'Cliente',
      caseCode: context.caseCode,
      caseTitle: context.caseTitle,
      subject: input.email.subject,
      body: input.email.body,
      highlights: input.email.highlights,
      ctaLabel: input.email.ctaLabel,
      ctaUrl: input.email.ctaUrl ?? portalCaseUrl(input.caseId),
    }).catch((err) => console.error('[notifyClient] Error enviando correo al cliente:', err));
  } catch (err) {
    console.error('[notifyClient] Error notificando al cliente:', err);
  }
}
