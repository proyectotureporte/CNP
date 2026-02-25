import { writeClient } from './client';

interface LogEventParams {
  caseId: string;
  eventType: string;
  description: string;
  userId?: string | null;
  userName?: string | null;
}

export async function logCaseEvent({ caseId, eventType, description, userId, userName }: LogEventParams) {
  try {
    const doc: { _type: 'caseEvent'; [key: string]: unknown } = {
      _type: 'caseEvent',
      case: { _type: 'reference', _ref: caseId },
      eventType,
      description,
      createdByName: userName || 'Sistema',
    };
    if (userId && userId !== 'admin') {
      doc.createdBy = { _type: 'reference', _ref: userId };
    }
    await writeClient.create(doc);
  } catch {
    // Non-blocking: don't fail the main operation if event logging fails
  }
}
