import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type { Payment, PaymentMethod, PaymentStatus } from '@/lib/types';

const caseObj = nestedObj('c', { _id: 'c.id', caseCode: 'c.case_code', title: 'c.title' });
const quoteObj = nestedObj('q', { _id: 'q.id', version: 'q.version' });
const createdByObj = nestedObj('cb', { _id: 'cb.id', displayName: 'cb.display_name' });

const FIELDS = `
  p.id AS "_id", p.created_at AS "_createdAt", p.payment_number AS "paymentNumber",
  p.amount, p.percentage, p.due_date AS "dueDate", p.payment_date AS "paymentDate",
  p.payment_method AS "paymentMethod", p.status, p.transaction_reference AS "transactionReference",
  p.notes, p.file_url AS "receiptUrl"
`;

const JOINS = `
  LEFT JOIN cases c ON c.id = p.case_id
  LEFT JOIN crm_client cl ON cl.id = c.client_id
  LEFT JOIN quote q ON q.id = p.quote_id
  LEFT JOIN crm_user cb ON cb.id = p.created_by_id
`;

export async function listCasePayments(caseId: string): Promise<Payment[]> {
  return query<Payment>(
    `SELECT ${FIELDS}, ${quoteObj} AS "quoteRef", ${createdByObj} AS "createdBy"
     FROM payment p ${JOINS}
     WHERE p.case_id = $1 ORDER BY p.payment_number ASC`,
    [caseId],
  );
}

export async function listAllPayments(status = '', limit = 20, offset = 0): Promise<Payment[]> {
  return query<Payment>(
    `SELECT ${FIELDS}, ${caseObj} AS "caseRef", ${quoteObj} AS "quoteRef",
       cl.name AS "clientName", ${createdByObj} AS "createdBy"
     FROM payment p ${JOINS}
     WHERE ($1 = '' OR p.status = $1::payment_status)
     ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`,
    [status, limit, offset],
  );
}

export async function countAllPayments(status = ''): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT count(*)::int AS count FROM payment WHERE ($1 = '' OR status = $1::payment_status)`,
    [status],
  );
  return row?.count ?? 0;
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  return queryOne<Payment>(
    `SELECT ${FIELDS}, ${caseObj} AS "caseRef", ${quoteObj} AS "quoteRef",
       cl.name AS "clientName", ${createdByObj} AS "createdBy"
     FROM payment p ${JOINS} WHERE p.id = $1`,
    [id],
  );
}

export async function listQuotePayments(quoteId: string): Promise<Payment[]> {
  return query<Payment>(
    `SELECT p.id AS "_id", p.created_at AS "_createdAt", p.payment_number AS "paymentNumber",
       p.amount, p.percentage, p.due_date AS "dueDate", p.payment_date AS "paymentDate",
       p.status, p.file_url AS "receiptUrl"
     FROM payment p WHERE p.quote_id = $1 ORDER BY p.payment_number ASC`,
    [quoteId],
  );
}

export async function listMonthPayments(startDate: string, endDate: string): Promise<Payment[]> {
  return query<Payment>(
    `SELECT ${FIELDS}, ${caseObj} AS "caseRef", ${quoteObj} AS "quoteRef", cl.name AS "clientName"
     FROM payment p ${JOINS}
     WHERE p.due_date >= $1::timestamptz AND p.due_date < $2::timestamptz
     ORDER BY p.due_date ASC`,
    [startDate, endDate],
  );
}

export async function listUpcomingPayments(now: string, fiveDaysLater: string): Promise<Payment[]> {
  return query<Payment>(
    `SELECT p.id AS "_id", p.payment_number AS "paymentNumber", p.amount, p.due_date AS "dueDate", p.status,
       ${caseObj} AS "caseRef", cl.name AS "clientName"
     FROM payment p LEFT JOIN cases c ON c.id = p.case_id LEFT JOIN crm_client cl ON cl.id = c.client_id
     WHERE p.status = 'pendiente' AND p.due_date >= $1::timestamptz AND p.due_date <= $2::timestamptz
     ORDER BY p.due_date ASC`,
    [now, fiveDaysLater],
  );
}

export async function listOverduePayments(now: string): Promise<Payment[]> {
  return query<Payment>(
    `SELECT p.id AS "_id", p.payment_number AS "paymentNumber", p.amount, p.due_date AS "dueDate", p.status,
       ${caseObj} AS "caseRef", cl.name AS "clientName"
     FROM payment p LEFT JOIN cases c ON c.id = p.case_id LEFT JOIN crm_client cl ON cl.id = c.client_id
     WHERE p.status = 'pendiente' AND p.due_date < $1::timestamptz
     ORDER BY p.due_date ASC`,
    [now],
  );
}

export async function listPaymentsLast12Months(twelveMonthsAgo: string): Promise<Payment[]> {
  return query<Payment>(
    `SELECT id AS "_id", amount, due_date AS "dueDate", status
     FROM payment WHERE due_date >= $1::timestamptz ORDER BY due_date ASC`,
    [twelveMonthsAgo],
  );
}

export async function reportRevenue(startDate = '', endDate = ''): Promise<Payment[]> {
  return query<Payment>(
    `SELECT p.id AS "_id", p.amount, p.payment_date AS "paymentDate", p.payment_method AS "paymentMethod",
       ${nestedObj('c', { _id: 'c.id', caseCode: 'c.case_code', title: 'c.title', discipline: 'c.discipline' })} AS "caseRef"
     FROM payment p LEFT JOIN cases c ON c.id = p.case_id
     WHERE p.status = 'validado'
       AND ($1 = '' OR p.payment_date >= $1::timestamptz)
       AND ($2 = '' OR p.payment_date <= $2::timestamptz)
     ORDER BY p.payment_date DESC`,
    [startDate, endDate],
  );
}

export interface PaymentInput {
  caseId: string;
  quoteId?: string | null;
  paymentNumber?: number | null;
  amount?: number | null;
  percentage?: number | null;
  dueDate?: string | null;
  paymentDate?: string | null;
  paymentMethod?: PaymentMethod | null;
  status?: PaymentStatus;
  transactionReference?: string | null;
  fileUrl?: string | null;
  fileAssetId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  notes?: string | null;
  createdById?: string | null;
}

function toColumns(input: Partial<PaymentInput>): Record<string, unknown> {
  return pruneUndefined({
    case_id: input.caseId,
    quote_id: input.quoteId,
    payment_number: input.paymentNumber,
    amount: input.amount,
    percentage: input.percentage,
    due_date: input.dueDate,
    payment_date: input.paymentDate,
    payment_method: input.paymentMethod,
    status: input.status,
    transaction_reference: input.transactionReference,
    file_url: input.fileUrl,
    file_asset_id: input.fileAssetId,
    file_name: input.fileName,
    mime_type: input.mimeType,
    file_size: input.fileSize,
    notes: input.notes,
    created_by_id: input.createdById,
  });
}

export async function createPayment(input: PaymentInput): Promise<Payment | null> {
  const id = newId();
  const { text, values } = buildInsert('payment', { id, ...toColumns(input) });
  await query(text, values);
  return getPaymentById(id);
}

export async function updatePayment(id: string, patch: Partial<PaymentInput>): Promise<Payment | null> {
  const upd = buildUpdate('payment', id, toColumns(patch));
  if (upd) await query(upd.text, upd.values);
  return getPaymentById(id);
}

export async function deletePayment(id: string): Promise<void> {
  await query('DELETE FROM payment WHERE id = $1', [id]);
}
