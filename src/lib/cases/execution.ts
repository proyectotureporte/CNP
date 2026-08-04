import { cases } from '@/lib/db';
import { addBusinessDays } from '@/lib/dates/businessDays';
import { queryOne } from '@/lib/db';
import { logCaseEvent } from '@/lib/sanity/logEvent';
import { notifyUsersAndAdmins } from '@/lib/notify';
import { triggerEvent } from '@/lib/realtime/server';

/**
 * Al confirmarse el PRIMER pago validado del caso arranca el reloj interno con
 * los días HÁBILES cotizados (festivos de Colombia incluidos).
 * Idempotente: si el reloj ya está en marcha no hace nada.
 */
export const EXECUTION_BUSINESS_DAYS = 15;

export async function maybeStartExecutionClock(
  caseId: string,
  actor: { userId?: string | null; userName?: string | null } = {},
): Promise<void> {
  try {
    const caseRow = await cases.getCaseById(caseId);
    if (!caseRow || caseRow.executionStartDate) return;

    const quoteTerms = await queryOne<{ quotedBusinessDays: number | null }>(
      `SELECT quoted_business_days AS "quotedBusinessDays" FROM quote
       WHERE case_id = $1 AND status = 'aprobada'
       ORDER BY approved_at DESC NULLS LAST, version DESC LIMIT 1`,
      [caseId],
    );
    const businessDays = Math.min(365, Math.max(1, quoteTerms?.quotedBusinessDays || EXECUTION_BUSINESS_DAYS));
    const start = new Date();
    const deadline = addBusinessDays(start, businessDays);

    await cases.updateCase(caseId, {
      executionStartDate: start.toISOString(),
      executionDeadline: deadline.toISOString(),
      executionBusinessDays: businessDays,
      executionRemainingBusinessDays: businessDays,
      executionState: 'activa',
      // Pago confirmado implica propuesta ganada en el pipeline comercial.
      ...(caseRow.commercialStatus !== 'ganado' ? { commercialStatus: 'ganado' as const } : {}),
    });

    const deadlineLabel = deadline.toLocaleDateString('es-CO', { timeZone: 'UTC' });
    logCaseEvent({
      caseId,
      eventType: 'execution_started',
      description: `Pago confirmado: inicia la ejecución (${businessDays} días hábiles cotizados, vence el ${deadlineLabel})`,
      userId: actor.userId ?? null,
      userName: actor.userName ?? null,
    });

    notifyUsersAndAdmins({
      userIds: [
        caseRow.commercial?._id,
        caseRow.technicalAnalyst?._id,
        caseRow.assignedExpert?._id,
        caseRow.assignedFinanciero?._id,
        caseRow.assignedJuridico?._id,
      ],
      type: 'success',
      priority: 'alta',
      title: `Ejecución iniciada: ${caseRow.caseCode}`,
      message: `Pago confirmado en "${caseRow.title}". El plazo de ${businessDays} días hábiles cotizados vence el ${deadlineLabel}.`,
      linkUrl: `/crm/cases/${caseId}`,
      mailbox: 'admin',
    }).catch((err) => console.error('[execution] Error notificando inicio de ejecución:', err));

    triggerEvent('case:updated', { id: caseId, executionStarted: true });
  } catch (err) {
    console.error('[execution] Error iniciando reloj de ejecución:', err);
  }
}
