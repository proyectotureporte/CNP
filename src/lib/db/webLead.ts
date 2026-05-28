import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined } from './pool';

export interface WebLead {
  _id: string;
  _createdAt: string;
  nombre?: string;
  email?: string;
  mensaje?: string;
  origen: 'landing' | 'abogados' | 'empresas' | 'jueces';
  estado: 'nuevo' | 'en_gestion' | 'convertido' | 'descartado';
  notas?: string;
}

const SELECT = `
  id AS "_id", created_at AS "_createdAt", nombre, email, mensaje, origen, estado, notas
`;

export async function listWebLeads(estado = '', origen = ''): Promise<WebLead[]> {
  return query<WebLead>(
    `SELECT ${SELECT} FROM web_lead
     WHERE ($1 = '' OR estado = $1::web_lead_status) AND ($2 = '' OR origen = $2::web_lead_origin)
     ORDER BY created_at DESC`,
    [estado, origen],
  );
}

export async function getWebLeadById(id: string): Promise<WebLead | null> {
  return queryOne<WebLead>(`SELECT ${SELECT} FROM web_lead WHERE id = $1`, [id]);
}

export interface WebLeadInput {
  nombre?: string | null;
  email?: string | null;
  mensaje?: string | null;
  origen?: WebLead['origen'];
  estado?: WebLead['estado'];
  notas?: string | null;
}

export async function createWebLead(input: WebLeadInput): Promise<WebLead | null> {
  const id = newId();
  const { text, values } = buildInsert('web_lead', {
    id,
    nombre: input.nombre ?? null,
    email: input.email ?? null,
    mensaje: input.mensaje ?? null,
    origen: input.origen ?? 'landing',
    estado: input.estado ?? 'nuevo',
    notas: input.notas ?? null,
  });
  await query(text, values);
  return getWebLeadById(id);
}

export async function updateWebLead(id: string, patch: Partial<WebLeadInput>): Promise<WebLead | null> {
  const data = pruneUndefined({
    nombre: patch.nombre,
    email: patch.email,
    mensaje: patch.mensaje,
    origen: patch.origen,
    estado: patch.estado,
    notas: patch.notas,
  });
  const upd = buildUpdate('web_lead', id, data);
  if (upd) await query(upd.text, upd.values);
  return getWebLeadById(id);
}

export async function deleteWebLead(id: string): Promise<void> {
  await query('DELETE FROM web_lead WHERE id = $1', [id]);
}
