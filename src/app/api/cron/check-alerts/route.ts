import { NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import {
  casesNeedingHearingAlertQuery,
  casesWithUrgentDeadlineQuery,
  recentHearingAlertTitlesQuery,
  recentDeadlineAlertTitlesQuery,
  listAdminUserIdsQuery,
} from '@/lib/sanity/queries';

interface AlertCase {
  _id: string;
  caseCode: string;
  title: string;
  deadlineDate?: string;
  commercialId?: string;
  technicalAnalystId?: string;
  assignedExpertId?: string;
}

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

    // Threshold: 7 days from now
    const thresholdDate = new Date(now);
    thresholdDate.setDate(thresholdDate.getDate() + 7);
    const threshold = thresholdDate.toISOString().split('T')[0];

    // Dedup windows
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const sixDaysAgo = new Date(now);
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

    // Fetch all data in parallel
    const [
      hearingCases,
      deadlineCases,
      recentHearingTitles,
      recentDeadlineTitles,
      adminIds,
    ] = await Promise.all([
      client.fetch<AlertCase[]>(casesNeedingHearingAlertQuery),
      client.fetch<AlertCase[]>(casesWithUrgentDeadlineQuery, { threshold, today }),
      client.fetch<string[]>(recentHearingAlertTitlesQuery, { since: fourteenDaysAgo.toISOString() }),
      client.fetch<string[]>(recentDeadlineAlertTitlesQuery, { since: sixDaysAgo.toISOString() }),
      client.fetch<string[]>(listAdminUserIdsQuery),
    ]);

    const recentHearingSet = new Set(recentHearingTitles);
    const recentDeadlineSet = new Set(recentDeadlineTitles);

    let createdCount = 0;
    const transaction = writeClient.transaction();

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
        transaction.create({
          _type: 'notification',
          type: 'warning',
          priority: 'normal',
          title: alertTitle,
          message: `Verifique si el caso ${c.caseCode} ya tiene audiencia programada`,
          linkUrl: `/crm/cases/${c._id}`,
          isRead: false,
          user: { _type: 'reference', _ref: userId },
        });
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
        transaction.create({
          _type: 'notification',
          type: 'error',
          priority: 'alta',
          title: alertTitle,
          message: `El caso ${c.caseCode} vence en ${days} dia${days !== 1 ? 's' : ''} (${formattedDate}). Requiere atencion urgente.`,
          linkUrl: `/crm/cases/${c._id}`,
          isRead: false,
          user: { _type: 'reference', _ref: userId },
        });
        createdCount++;
      }
    }

    if (createdCount > 0) {
      await transaction.commit();
    }

    return NextResponse.json({
      success: true,
      hearingAlerts: hearingCases.length,
      deadlineAlerts: deadlineCases.length,
      notificationsCreated: createdCount,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error procesando alertas' },
      { status: 500 }
    );
  }
}
