import { NextRequest, NextResponse } from 'next/server';
import { cases, crmUser, notification, quote } from '@/lib/db';
import { notifyUsers } from '@/lib/notify';
import { businessDaysBetween } from '@/lib/dates/businessDays';
import type { CasePriority } from '@/lib/types';

// Automatizaciones internas (item 21) — corre 3×/día vía systemd `cnp-check-alerts`:
//   1. Audiencias sin programar
//   2. Casos próximos a vencer (ventana según urgencia — RF-06)
//   3. Documentos REQUERIDOS sin recibir (recordatorio documental, cadencia según urgencia)
//   4. Cotizaciones enviadas: expiración automática por valid_until
//   5. Seguimientos comerciales vencidos (next_follow_up_date) — RF-10
//   6. Propuestas enviadas sin respuesta ni seguimiento programado
//   7. Reloj de ejecución de 15 días hábiles por vencer (item 20)

function daysFromNow(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function inDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// RF-06: la urgencia del caso define con cuánta antelación se avisa del
// vencimiento y cada cuánto se repite el recordatorio documental.
const DEADLINE_WINDOW_DAYS: Record<CasePriority, number> = { urgente: 14, alta: 10, normal: 7, baja: 4 };
const DOCS_REMINDER_EVERY_DAYS: Record<CasePriority, number> = { urgente: 1, alta: 2, normal: 4, baja: 7 };

function isDue(lastSent: string | undefined, everyDays: number): boolean {
  if (!lastSent) return true;
  const last = new Date(lastSent).getTime();
  return Date.now() - last >= everyDays * 24 * 60 * 60 * 1000;
}

export async function POST(request: NextRequest) {
  try {
    // Ruta pública (bypass de middleware): protegida por secreto compartido.
    const secret = process.env.CRON_SECRET;
    const provided = request.headers.get('x-cron-secret');
    if (secret && provided !== secret) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const maxDeadlineWindow = inDaysIso(Math.max(...Object.values(DEADLINE_WINDOW_DAYS)));

    const [
      hearingCases,
      deadlineCases,
      docsPending,
      expiredQuotes,
      followUpsDue,
      staleQuotes,
      executionSoon,
      recentHearing,
      recentDeadline,
      recentDocs,
      recentFollowUp,
      recentStale,
      recentExecution,
      adminIds,
    ] = await Promise.all([
      cases.casesNeedingHearing(),
      cases.casesWithUpcomingDeadline(today, maxDeadlineWindow),
      cases.casesWithRequiredDocsPending(),
      quote.expireOverdueQuotes(),
      quote.listQuotesFollowUpDue(new Date().toISOString()),
      quote.listSentQuotesWithoutResponse(daysAgoIso(7)),
      cases.casesWithExecutionDeadlineSoon(inDaysIso(7)),
      notification.mapRecentAlertLastSent('Alerta de Audiencia:', daysAgoIso(14)),
      notification.mapRecentAlertLastSent('Caso Proximo a Vencer:', daysAgoIso(6)),
      notification.mapRecentAlertLastSent('Documentos Pendientes:', daysAgoIso(8)),
      notification.mapRecentAlertLastSent('Seguimiento de Propuesta:', daysAgoIso(1)),
      notification.mapRecentAlertLastSent('Propuesta sin Respuesta:', daysAgoIso(6)),
      notification.mapRecentAlertLastSent('Ejecucion por Vencer:', daysAgoIso(2)),
      crmUser.listAdminUserIds(),
    ]);

    const tasks: Promise<unknown>[] = [];
    let createdCount = 0;

    const push = (
      userIds: Array<string | null | undefined>,
      title: string,
      message: string,
      linkUrl: string,
      type: 'info' | 'warning' | 'success' | 'error',
      priority: 'baja' | 'normal' | 'alta',
    ) => {
      const ids = [...new Set([...userIds.filter(Boolean), ...adminIds])] as string[];
      createdCount += ids.length;
      tasks.push(notifyUsers({ userIds: ids, title, message, linkUrl, type, priority }));
    };

    // --- 1. Audiencias -------------------------------------------------------
    for (const c of hearingCases) {
      const title = `Alerta de Audiencia: ${c.caseCode}`;
      if (recentHearing.has(title)) continue;
      push(
        [c.commercialId, c.technicalAnalystId, c.assignedExpertId],
        title,
        `Verifique si el caso ${c.caseCode} ya tiene audiencia programada`,
        `/crm/cases/${c._id}`,
        'warning', 'normal',
      );
    }

    // --- 2. Vencimientos con ventana por urgencia (RF-06) --------------------
    for (const c of deadlineCases) {
      const title = `Caso Proximo a Vencer: ${c.caseCode}`;
      if (recentDeadline.has(title)) continue;
      const days = daysFromNow(c.deadlineDate!);
      const window = DEADLINE_WINDOW_DAYS[(c.priority as CasePriority) ?? 'normal'] ?? 7;
      if (days > window) continue; // aún fuera de la ventana de SU urgencia
      const formattedDate = new Date(c.deadlineDate!).toLocaleDateString('es-CO');
      push(
        [c.commercialId, c.technicalAnalystId, c.assignedExpertId],
        title,
        `El caso ${c.caseCode} vence en ${days} dia${days !== 1 ? 's' : ''} (${formattedDate}). Requiere atencion urgente.`,
        `/crm/cases/${c._id}`,
        'error', 'alta',
      );
    }

    // --- 3. Documentos requeridos sin recibir (cadencia por urgencia) --------
    for (const c of docsPending) {
      const title = `Documentos Pendientes: ${c.caseCode}`;
      const every = DOCS_REMINDER_EVERY_DAYS[(c.priority as CasePriority) ?? 'normal'] ?? 4;
      if (!isDue(recentDocs.get(title), every)) continue;
      const names = (c.pendingNames ?? []).slice(0, 5).join(', ');
      push(
        [c.commercialId, c.technicalAnalystId],
        title,
        `El caso ${c.caseCode} tiene ${c.pendingCount} documento(s) requerido(s) sin recibir: ${names}`,
        `/crm/cases/${c._id}`,
        'warning', c.priority === 'urgente' || c.priority === 'alta' ? 'alta' : 'normal',
      );
    }

    // --- 4. Cotizaciones expiradas automáticamente ---------------------------
    for (const q of expiredQuotes) {
      push(
        [q.createdById, q.commercialId],
        `Propuesta Expirada: ${q.caseCode} v${q.version}`,
        `La cotización v${q.version} del caso ${q.caseCode} expiró (válida hasta ${new Date(q.validUntil!).toLocaleDateString('es-CO')}). Cree una nueva versión si el cliente sigue interesado.`,
        `/crm/cases/${q.caseId}`,
        'warning', 'alta',
      );
    }

    // --- 5. Seguimientos comerciales vencidos (RF-10) ------------------------
    for (const q of followUpsDue) {
      const title = `Seguimiento de Propuesta: ${q.caseCode} v${q.version}`;
      if (recentFollowUp.has(title)) continue;
      push(
        [q.createdById, q.commercialId],
        title,
        `Hoy toca hacer seguimiento a la cotización v${q.version} del caso ${q.caseCode} ("${q.caseTitle}").`,
        `/crm/cases/${q.caseId}`,
        'info', 'alta',
      );
    }

    // --- 6. Propuestas enviadas sin respuesta (>7 días) ----------------------
    for (const q of staleQuotes) {
      const title = `Propuesta sin Respuesta: ${q.caseCode} v${q.version}`;
      if (recentStale.has(title)) continue;
      push(
        [q.createdById, q.commercialId],
        title,
        `La cotización v${q.version} del caso ${q.caseCode} lleva más de 7 días enviada sin respuesta ni seguimiento programado.`,
        `/crm/cases/${q.caseId}`,
        'warning', 'normal',
      );
    }

    // --- 7. Ejecución de 15 días hábiles por vencer (item 20) ----------------
    for (const c of executionSoon) {
      const title = `Ejecucion por Vencer: ${c.caseCode}`;
      if (recentExecution.has(title)) continue;
      const remaining = businessDaysBetween(new Date(), new Date(c.executionDeadline));
      if (remaining > 3) continue;
      push(
        [c.commercialId, c.technicalAnalystId, c.assignedExpertId, c.assignedFinancieroId],
        title,
        `Quedan ${remaining} día(s) hábil(es) del plazo de ejecución del caso ${c.caseCode} (vence el ${new Date(c.executionDeadline).toLocaleDateString('es-CO')}).`,
        `/crm/cases/${c._id}`,
        'error', 'alta',
      );
    }

    await Promise.all(tasks);

    return NextResponse.json({
      success: true,
      hearingAlerts: hearingCases.length,
      deadlineAlerts: deadlineCases.length,
      docsPendingAlerts: docsPending.length,
      quotesExpired: expiredQuotes.length,
      followUpsDue: followUpsDue.length,
      staleQuotes: staleQuotes.length,
      executionAlerts: executionSoon.length,
      notificationsCreated: createdCount,
    });
  } catch (err) {
    console.error('[check-alerts] Error:', err);
    return NextResponse.json({ success: false, error: 'Error procesando alertas' }, { status: 500 });
  }
}
