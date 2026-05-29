import { NextResponse } from 'next/server';
import { cases, crmUser, notification } from '@/lib/db';

function daysFromNow(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export async function POST() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const thresholdDate = new Date(now);
    thresholdDate.setDate(thresholdDate.getDate() + 7);
    const threshold = thresholdDate.toISOString().split('T')[0];

    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const sixDaysAgo = new Date(now);
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

    const [hearingCases, deadlineCases, recentHearingTitles, recentDeadlineTitles, adminIds] = await Promise.all([
      cases.casesNeedingHearing(),
      cases.casesWithUrgentDeadline(today, threshold),
      notification.listRecentAlertTitles('Alerta de Audiencia:', fourteenDaysAgo.toISOString()),
      notification.listRecentAlertTitles('Caso Proximo a Vencer:', sixDaysAgo.toISOString()),
      crmUser.listAdminUserIds(),
    ]);

    const recentHearingSet = new Set(recentHearingTitles);
    const recentDeadlineSet = new Set(recentDeadlineTitles);

    const tasks: Promise<unknown>[] = [];
    let createdCount = 0;

    // --- Hearing Alerts ---
    for (const c of hearingCases) {
      const alertTitle = `Alerta de Audiencia: ${c.caseCode}`;
      if (recentHearingSet.has(alertTitle)) continue;

      const recipients = new Set<string>();
      if (c.commercialId) recipients.add(c.commercialId);
      if (c.technicalAnalystId) recipients.add(c.technicalAnalystId);
      if (c.assignedExpertId) recipients.add(c.assignedExpertId);
      for (const aid of adminIds) recipients.add(aid);

      for (const userId of recipients) {
        tasks.push(notification.createNotification({
          userId,
          type: 'warning',
          priority: 'normal',
          title: alertTitle,
          message: `Verifique si el caso ${c.caseCode} ya tiene audiencia programada`,
          linkUrl: `/crm/cases/${c._id}`,
        }));
        createdCount++;
      }
    }

    // --- Deadline Alerts ---
    for (const c of deadlineCases) {
      const alertTitle = `Caso Proximo a Vencer: ${c.caseCode}`;
      if (recentDeadlineSet.has(alertTitle)) continue;

      const days = daysFromNow(c.deadlineDate!);
      const formattedDate = new Date(c.deadlineDate!).toLocaleDateString('es-CO');

      const recipients = new Set<string>();
      if (c.commercialId) recipients.add(c.commercialId);
      if (c.technicalAnalystId) recipients.add(c.technicalAnalystId);
      if (c.assignedExpertId) recipients.add(c.assignedExpertId);
      for (const aid of adminIds) recipients.add(aid);

      for (const userId of recipients) {
        tasks.push(notification.createNotification({
          userId,
          type: 'error',
          priority: 'alta',
          title: alertTitle,
          message: `El caso ${c.caseCode} vence en ${days} dia${days !== 1 ? 's' : ''} (${formattedDate}). Requiere atencion urgente.`,
          linkUrl: `/crm/cases/${c._id}`,
        }));
        createdCount++;
      }
    }

    await Promise.all(tasks);

    return NextResponse.json({
      success: true,
      hearingAlerts: hearingCases.length,
      deadlineAlerts: deadlineCases.length,
      notificationsCreated: createdCount,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error procesando alertas' }, { status: 500 });
  }
}
