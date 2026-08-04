import { buildInsert, newId, nestedObj, query, queryOne, withTransaction } from './pool';
import type { DocumentRequest } from '@/lib/types';

const requestedByObj = nestedObj('rb', { _id: 'rb.id', displayName: 'rb.display_name' });
const juridicoObj = nestedObj('aj', { _id: 'aj.id', displayName: 'aj.display_name' });

const SELECT = `
  dr.id AS "_id", dr.created_at AS "_createdAt", dr.description, dr.status,
  ${requestedByObj} AS "requestedBy", ${juridicoObj} AS "assignedJuridico"
`;

export async function listDocumentRequests(caseId: string): Promise<DocumentRequest[]> {
  return query<DocumentRequest>(
    `SELECT ${SELECT} FROM document_request dr
     LEFT JOIN crm_user rb ON rb.id = dr.requested_by_id
     LEFT JOIN crm_user aj ON aj.id = dr.assigned_juridico_id
     WHERE dr.case_id = $1 ORDER BY dr.created_at DESC`,
    [caseId],
  );
}

export async function createDocumentRequest(input: {
  caseId: string;
  requestedById: string;
  assignedJuridicoId?: string | null;
  description: string;
}): Promise<DocumentRequest | null> {
  const id = newId();
  const { text, values } = buildInsert('document_request', {
    id,
    case_id: input.caseId,
    requested_by_id: input.requestedById,
    assigned_juridico_id: input.assignedJuridicoId ?? null,
    description: input.description,
    status: 'solicitada',
  });
  await query(text, values);
  return queryOne<DocumentRequest>(
    `SELECT ${SELECT} FROM document_request dr
     LEFT JOIN crm_user rb ON rb.id = dr.requested_by_id
     LEFT JOIN crm_user aj ON aj.id = dr.assigned_juridico_id
     WHERE dr.id = $1`,
    [id],
  );
}

/** Registra la solicitud y su mensaje al abogado en una sola transacción. */
export async function createDocumentRequestWithMessage(input: {
  caseId: string;
  requestedById: string;
  requestedByName: string;
  assignedJuridicoId: string;
  description: string;
}): Promise<DocumentRequest | null> {
  const requestId = newId();
  const messageId = newId();
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO document_request (
         id, case_id, requested_by_id, assigned_juridico_id, description, status
       ) VALUES ($1, $2, $3, $4, $5, 'solicitada')`,
      [
        requestId,
        input.caseId,
        input.requestedById,
        input.assignedJuridicoId,
        input.description,
      ],
    );
    await client.query(
      `INSERT INTO case_message (
         id, case_id, audience, sender_id, sender_name, sender_role, body
       ) VALUES ($1, $2, 'juridico_perito', $3, $4, 'perito', $5)`,
      [
        messageId,
        input.caseId,
        input.requestedById,
        input.requestedByName,
        `Solicitud de documentación al abogado: ${input.description}`,
      ],
    );
  });

  return queryOne<DocumentRequest>(
    `SELECT ${SELECT} FROM document_request dr
     LEFT JOIN crm_user rb ON rb.id = dr.requested_by_id
     LEFT JOIN crm_user aj ON aj.id = dr.assigned_juridico_id
     WHERE dr.id = $1`,
    [requestId],
  );
}
