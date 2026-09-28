import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj, withTransaction } from './pool';
import type { Quote, QuoteStatus } from '@/lib/types';

const approvedByObj = nestedObj('ab', { _id: 'ab.id', displayName: 'ab.display_name' });
const createdByObj = nestedObj('cb', { _id: 'cb.id', displayName: 'cb.display_name' });
const caseObj = nestedObj('c', { _id: 'c.id', caseCode: 'c.case_code', title: 'c.title' });

const SELECT = `
  q.id AS "_id", q.created_at AS "_createdAt", q.version,
  q.total_price AS "totalPrice", q.discount_percentage AS "discountPercentage",
  q.final_value AS "finalValue", q.status, q.valid_until AS "validUntil",
  q.sent_at AS "sentAt", q.approved_at AS "approvedAt", q.rejection_reason AS "rejectionReason",
  q.acceptance_notes AS "acceptanceNotes", q.channel,
  q.parent_quote_id AS "parentQuoteId", q.next_follow_up_date AS "nextFollowUpDate",
  q.notes, q.first_payment_date AS "firstPaymentDate", q.second_payment_date AS "secondPaymentDate",
  q.last_payment_date AS "lastPaymentDate",
  q.first_payment_percentage AS "firstPaymentPercentage", q.custom_split AS "customSplit",
  q.quoted_business_days AS "quotedBusinessDays",
  q.file_url AS "quoteDocumentUrl",
  ${approvedByObj} AS "approvedBy",
  ${createdByObj} AS "createdBy"
`;

const JOINS = `
  LEFT JOIN crm_user ab ON ab.id = q.approved_by_id
  LEFT JOIN crm_user cb ON cb.id = q.created_by_id
`;

export async function listCaseQuotes(caseId: string): Promise<Quote[]> {
  return query<Quote>(
    `SELECT ${SELECT} FROM quote q ${JOINS} WHERE q.case_id = $1 ORDER BY q.version DESC`,
    [caseId],
  );
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  return queryOne<Quote>(
    `SELECT ${SELECT}, ${caseObj} AS "case"
     FROM quote q ${JOINS} LEFT JOIN cases c ON c.id = q.case_id
     WHERE q.id = $1`,
    [id],
  );
}

export async function getQuoteAssetRow(id: string): Promise<{
  caseId: string;
  status: QuoteStatus;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
} | null> {
  return queryOne(
    `SELECT case_id AS "caseId", status, file_url AS "fileUrl", file_name AS "fileName",
       mime_type AS "mimeType" FROM quote WHERE id = $1`,
    [id],
  );
}

export async function countCaseQuotes(caseId: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    'SELECT count(*)::int AS count FROM quote WHERE case_id = $1',
    [caseId],
  );
  return row?.count ?? 0;
}

export async function listAllQuotes(status = '', limit = 20, offset = 0): Promise<Quote[]> {
  return query<Quote>(
    `SELECT ${SELECT}, ${caseObj} AS "case"
     FROM quote q ${JOINS} LEFT JOIN cases c ON c.id = q.case_id
     WHERE ($1 = '' OR q.status = $1::quote_status)
     ORDER BY q.created_at DESC LIMIT $2 OFFSET $3`,
    [status, limit, offset],
  );
}

export async function countAllQuotes(status = ''): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT count(*)::int AS count FROM quote WHERE ($1 = '' OR status = $1::quote_status)`,
    [status],
  );
  return row?.count ?? 0;
}

/** Mayor número de versión de cotización para un caso (para auto-incrementar). */
export async function getMaxQuoteVersion(caseId: string): Promise<number> {
  const row = await queryOne<{ max: number }>(
    'SELECT COALESCE(max(version), 0)::int AS max FROM quote WHERE case_id = $1',
    [caseId],
  );
  return row?.max ?? 0;
}

export interface QuoteInput {
  caseId: string;
  version?: number;
  totalPrice?: number | null;
  discountPercentage?: number;
  finalValue?: number | null;
  status?: QuoteStatus;
  validUntil?: string | null;
  sentAt?: string | null;
  approvedAt?: string | null;
  approvedById?: string | null;
  rejectionReason?: string | null;
  acceptanceNotes?: string | null;
  channel?: Quote['channel'] | null;
  parentQuoteId?: string | null;
  nextFollowUpDate?: string | null;
  notes?: string | null;
  createdById?: string | null;
  fileUrl?: string | null;
  fileAssetId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  firstPaymentDate?: string | null;
  secondPaymentDate?: string | null;
  lastPaymentDate?: string | null;
  firstPaymentPercentage?: number;
  customSplit?: boolean;
  quotedBusinessDays?: number | null;
}

function toColumns(input: Partial<QuoteInput>): Record<string, unknown> {
  return pruneUndefined({
    case_id: input.caseId,
    version: input.version,
    total_price: input.totalPrice,
    discount_percentage: input.discountPercentage,
    final_value: input.finalValue,
    status: input.status,
    valid_until: input.validUntil,
    sent_at: input.sentAt,
    approved_at: input.approvedAt,
    approved_by_id: input.approvedById,
    rejection_reason: input.rejectionReason,
    acceptance_notes: input.acceptanceNotes,
    channel: input.channel,
    parent_quote_id: input.parentQuoteId,
    next_follow_up_date: input.nextFollowUpDate,
    notes: input.notes,
    created_by_id: input.createdById,
    file_url: input.fileUrl,
    file_asset_id: input.fileAssetId,
    file_name: input.fileName,
    mime_type: input.mimeType,
    file_size: input.fileSize,
    first_payment_date: input.firstPaymentDate,
    second_payment_date: input.secondPaymentDate,
    last_payment_date: input.lastPaymentDate,
    first_payment_percentage: input.firstPaymentPercentage,
    custom_split: input.customSplit,
    quoted_business_days: input.quotedBusinessDays,
  });
}

export async function createQuote(input: QuoteInput): Promise<Quote | null> {
  const id = newId();
  const { text, values } = buildInsert('quote', { id, ...toColumns(input) });
  await query(text, values);
  return getQuoteById(id);
}

export interface QuoteInstallmentInput {
  paymentNumber: 1 | 2 | 3;
  amount: number;
  percentage: number;
  dueDate?: string | null;
  createdById?: string | null;
}

export interface QuoteCaseDocumentInput {
  fileUrl: string;
  fileAssetId?: string | null;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
  description: string;
  uploadedById?: string | null;
}

/** Guarda la cotización, sus tres cuotas y su documento en una sola transacción. */
export async function createQuoteWithPaymentPlan(
  input: QuoteInput,
  installments: QuoteInstallmentInput[],
  document?: QuoteCaseDocumentInput,
): Promise<Quote | null> {
  const quoteId = newId();
  await withTransaction(async (client) => {
    const quoteInsert = buildInsert('quote', { id: quoteId, ...toColumns(input) });
    await client.query(quoteInsert.text, quoteInsert.values);

    for (const installment of installments) {
      const paymentInsert = buildInsert('payment', {
        id: newId(),
        case_id: input.caseId,
        quote_id: quoteId,
        payment_number: installment.paymentNumber,
        amount: installment.amount,
        percentage: installment.percentage,
        due_date: installment.dueDate ?? null,
        status: 'pendiente',
        created_by_id: installment.createdById ?? null,
      });
      await client.query(paymentInsert.text, paymentInsert.values);
    }

    if (document) {
      const documentInsert = buildInsert('case_document', {
        id: newId(),
        case_id: input.caseId,
        uploaded_by_id: document.uploadedById ?? null,
        category: 'propuesta_comercial',
        status: 'recibido',
        is_required: false,
        file_url: document.fileUrl,
        file_asset_id: document.fileAssetId ?? null,
        file_name: document.fileName,
        mime_type: document.mimeType ?? null,
        file_size: document.fileSize ?? null,
        version: input.version ?? 1,
        is_visible_to_client: true,
        description: document.description,
      });
      await client.query(documentInsert.text, documentInsert.values);
    }
  });
  return getQuoteById(quoteId);
}

/** Recalcula atómicamente el borrador y las tres cuotas vinculadas. */
export async function updateQuoteWithPaymentPlan(
  id: string,
  patch: Partial<QuoteInput>,
  caseId: string,
  installments: QuoteInstallmentInput[],
): Promise<Quote | null> {
  await withTransaction(async (client) => {
    const quoteUpdate = buildUpdate('quote', id, toColumns(patch));
    if (quoteUpdate) await client.query(quoteUpdate.text, quoteUpdate.values);

    for (const installment of installments) {
      const existing = await client.query<{ id: string; status: string }>(
        `SELECT id, status FROM payment
         WHERE quote_id = $1 AND payment_number = $2 FOR UPDATE`,
        [id, installment.paymentNumber],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].status !== 'pendiente') {
          throw new Error('No se puede recalcular una cuota que ya no está pendiente');
        }
        await client.query(
          `UPDATE payment SET amount = $1, percentage = $2, due_date = $3, updated_at = now()
           WHERE id = $4`,
          [installment.amount, installment.percentage, installment.dueDate ?? null, existing.rows[0].id],
        );
      } else {
        const paymentInsert = buildInsert('payment', {
          id: newId(),
          case_id: caseId,
          quote_id: id,
          payment_number: installment.paymentNumber,
          amount: installment.amount,
          percentage: installment.percentage,
          due_date: installment.dueDate ?? null,
          status: 'pendiente',
          created_by_id: installment.createdById ?? null,
        });
        await client.query(paymentInsert.text, paymentInsert.values);
      }
    }
  });
  return getQuoteById(id);
}

export async function updateQuote(id: string, patch: Partial<QuoteInput>): Promise<Quote | null> {
  const upd = buildUpdate('quote', id, toColumns(patch));
  if (upd) await query(upd.text, upd.values);
  return getQuoteById(id);
}

export async function deleteQuote(id: string): Promise<void> {
  await query('DELETE FROM quote WHERE id = $1', [id]);
}

// --- Automatizaciones (cron, item 21) ---------------------------------------

export interface QuoteAlertRow {
  _id: string;
  caseId: string;
  caseCode: string;
  caseTitle: string;
  version: number;
  createdById: string | null;
  commercialId: string | null;
  nextFollowUpDate?: string;
  sentAt?: string;
  validUntil?: string;
}

const ALERT_SELECT = `
  q.id AS "_id", q.case_id AS "caseId", c.case_code AS "caseCode", c.title AS "caseTitle",
  q.version, q.created_by_id AS "createdById", c.commercial_id AS "commercialId",
  q.next_follow_up_date AS "nextFollowUpDate", q.sent_at AS "sentAt", q.valid_until AS "validUntil"
`;

/** Expira cotizaciones enviadas cuyo valid_until ya pasó. Devuelve las expiradas. */
export async function expireOverdueQuotes(): Promise<QuoteAlertRow[]> {
  return query<QuoteAlertRow>(
    `UPDATE quote q SET status = 'expirada'
     FROM cases c
     WHERE c.id = q.case_id AND q.status = 'enviada'
       AND q.valid_until IS NOT NULL AND q.valid_until < now()
     RETURNING ${ALERT_SELECT}`,
  );
}

/** Cotizaciones enviadas con seguimiento programado ya vencido (RF-10). */
export async function listQuotesFollowUpDue(today: string): Promise<QuoteAlertRow[]> {
  return query<QuoteAlertRow>(
    `SELECT ${ALERT_SELECT}
     FROM quote q JOIN cases c ON c.id = q.case_id
     WHERE q.status = 'enviada' AND q.next_follow_up_date IS NOT NULL
       AND q.next_follow_up_date <= $1::timestamptz`,
    [today],
  );
}

/** Cotizaciones enviadas sin respuesta ni seguimiento programado desde antes del corte. */
export async function listSentQuotesWithoutResponse(cutoff: string): Promise<QuoteAlertRow[]> {
  return query<QuoteAlertRow>(
    `SELECT ${ALERT_SELECT}
     FROM quote q JOIN cases c ON c.id = q.case_id
     WHERE q.status = 'enviada' AND q.next_follow_up_date IS NULL
       AND q.sent_at IS NOT NULL AND q.sent_at <= $1::timestamptz`,
    [cutoff],
  );
}
