import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined } from './pool';
import type { CrmClient } from '@/lib/types';

const BASE = `
  c.id AS "_id", 'crmClient' AS "_type", c.created_at AS "_createdAt", c.updated_at AS "_updatedAt",
  c.brand, c.name, c.email, c.phone, c.company, c.position, c.notes, c.status,
  c.client_type AS "clientType", c.created_by AS "createdBy"
`;

// peritusRegistro resumido (lista): { _id, estadoDocumentacion }
const PERITUS_SUMMARY = `
  CASE WHEN rp.id IS NULL THEN NULL
       ELSE json_build_object('_id', rp.id, 'estadoDocumentacion', rp.estado_documentacion)
  END AS "peritusRegistro"
`;

const PERITUS_LATERAL = `
  LEFT JOIN LATERAL (
    SELECT id, estado_documentacion
    FROM registro_peritus WHERE client_id = c.id
    ORDER BY created_at DESC LIMIT 1
  ) rp ON TRUE
`;

export interface ListClientsParams {
  search?: string;
  brand?: string;
}

export async function listClients({ search = '', brand = '' }: ListClientsParams = {}): Promise<CrmClient[]> {
  return query<CrmClient>(
    `SELECT ${BASE}, ${PERITUS_SUMMARY}
     FROM crm_client c
     ${PERITUS_LATERAL}
     WHERE ($1 = '' OR c.name ILIKE $1 || '%' OR c.email ILIKE $1 || '%' OR c.company ILIKE $1 || '%')
       AND ($2 = '' OR c.brand = $2::brand)
     ORDER BY c.created_at DESC`,
    [search, brand],
  );
}

/** Clientes cuyos casos están asignados a un financiero concreto. */
export async function listClientsForFinanciero(
  userId: string,
  { search = '', brand = '' }: ListClientsParams = {},
): Promise<CrmClient[]> {
  return query<CrmClient>(
    `SELECT ${BASE}, ${PERITUS_SUMMARY}
     FROM crm_client c
     ${PERITUS_LATERAL}
     WHERE c.id IN (
       SELECT DISTINCT client_id FROM cases
       WHERE assigned_financiero_id = $3 AND client_id IS NOT NULL
     )
       AND ($1 = '' OR c.name ILIKE $1 || '%' OR c.email ILIKE $1 || '%' OR c.company ILIKE $1 || '%')
       AND ($2 = '' OR c.brand = $2::brand)
     ORDER BY c.created_at DESC`,
    [search, brand, userId],
  );
}

export async function getClientById(id: string): Promise<CrmClient | null> {
  return queryOne<CrmClient>(
    `SELECT ${BASE},
       CASE WHEN rp.id IS NULL THEN NULL ELSE json_build_object(
         '_id', rp.id,
         'peritusId', rp.peritus_id,
         'nombreApellido', rp.nombre_apellido,
         'cedula', rp.cedula,
         'correo', rp.correo,
         'celular', rp.celular,
         'ciudad', rp.ciudad,
         'profesionOficio', rp.profesion_oficio,
         'cargo', rp.cargo,
         'experiencia', rp.experiencia,
         'especialidad', rp.especialidad,
         'edad', rp.edad,
         'hojaDeVidaUrl', rp.file_url,
         'estadoDocumentacion', rp.estado_documentacion,
         'notasValidacion', rp.notas_validacion,
         'fechaRegistro', rp.fecha_registro
       ) END AS "peritusRegistro"
     FROM crm_client c
     LEFT JOIN LATERAL (
       SELECT * FROM registro_peritus WHERE client_id = c.id ORDER BY created_at DESC LIMIT 1
     ) rp ON TRUE
     WHERE c.id = $1`,
    [id],
  );
}

export async function countClients(): Promise<number> {
  const row = await queryOne<{ count: number }>('SELECT count(*)::int AS count FROM crm_client');
  return row?.count ?? 0;
}

export async function recentClients(limit = 5): Promise<CrmClient[]> {
  return query<CrmClient>(
    `SELECT ${BASE} FROM crm_client c ORDER BY c.created_at DESC LIMIT $1`,
    [limit],
  );
}

export interface CrmClientInput {
  brand?: 'CNP' | 'Peritus';
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  notes?: string | null;
  status?: CrmClient['status'] | null;
  clientType?: CrmClient['clientType'] | null;
  createdBy?: string | null;
}

export async function createClient(input: CrmClientInput): Promise<CrmClient | null> {
  const id = newId();
  const { text, values } = buildInsert('crm_client', {
    id,
    brand: input.brand ?? 'CNP',
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    company: input.company ?? null,
    position: input.position ?? null,
    notes: input.notes ?? null,
    status: input.status ?? null,
    client_type: input.clientType ?? 'particular',
    created_by: input.createdBy ?? null,
  });
  await query(text, values);
  return getClientById(id);
}

export async function updateClient(id: string, patch: Partial<CrmClientInput>): Promise<CrmClient | null> {
  const data = pruneUndefined({
    brand: patch.brand,
    name: patch.name,
    email: patch.email,
    phone: patch.phone,
    company: patch.company,
    position: patch.position,
    notes: patch.notes,
    status: patch.status,
    client_type: patch.clientType,
    created_by: patch.createdBy,
  });
  const upd = buildUpdate('crm_client', id, data);
  if (upd) await query(upd.text, upd.values);
  return getClientById(id);
}

export async function deleteClient(id: string): Promise<void> {
  await query('DELETE FROM crm_client WHERE id = $1', [id]);
}
