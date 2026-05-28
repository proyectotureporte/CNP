import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined } from './pool';
import type { PeritusRegistro, PeritusDocStatus } from '@/lib/types';

const SELECT = `
  r.id AS "_id", r.peritus_id AS "peritusId", r.nombre_apellido AS "nombreApellido",
  r.cedula, r.correo, r.celular, r.ciudad, r.profesion_oficio AS "profesionOficio",
  r.cargo, r.experiencia, r.especialidad, r.edad, r.file_url AS "hojaDeVidaUrl",
  r.estado_documentacion AS "estadoDocumentacion", r.notas_validacion AS "notasValidacion",
  r.fecha_registro AS "fechaRegistro"
`;

export async function listRegistros(estado = ''): Promise<PeritusRegistro[]> {
  return query<PeritusRegistro>(
    `SELECT ${SELECT} FROM registro_peritus r
     WHERE ($1 = '' OR r.estado_documentacion = $1::peritus_doc_status)
     ORDER BY r.created_at DESC`,
    [estado],
  );
}

export async function getRegistroById(id: string): Promise<PeritusRegistro | null> {
  return queryOne<PeritusRegistro>(`SELECT ${SELECT} FROM registro_peritus r WHERE r.id = $1`, [id]);
}

export async function getRegistroByClientId(clientId: string): Promise<PeritusRegistro | null> {
  return queryOne<PeritusRegistro>(
    `SELECT ${SELECT} FROM registro_peritus r WHERE r.client_id = $1 ORDER BY r.created_at DESC LIMIT 1`,
    [clientId],
  );
}

export interface RegistroPeritusInput {
  peritusId?: string | null;
  nombreApellido?: string | null;
  cedula?: string | null;
  correo?: string | null;
  celular?: string | null;
  ciudad?: string | null;
  profesionOficio?: string | null;
  cargo?: string | null;
  experiencia?: string | null;
  especialidad?: string | null;
  edad?: string | null;
  fileUrl?: string | null;
  fileAssetId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  clientId?: string | null;
  fechaRegistro?: string | null;
  estadoDocumentacion?: PeritusDocStatus;
  notasValidacion?: string | null;
  activo?: boolean;
  contrasenaHash?: string | null;
}

function toColumns(input: Partial<RegistroPeritusInput>): Record<string, unknown> {
  return pruneUndefined({
    peritus_id: input.peritusId,
    nombre_apellido: input.nombreApellido,
    cedula: input.cedula,
    correo: input.correo,
    celular: input.celular,
    ciudad: input.ciudad,
    profesion_oficio: input.profesionOficio,
    cargo: input.cargo,
    experiencia: input.experiencia,
    especialidad: input.especialidad,
    edad: input.edad,
    file_url: input.fileUrl,
    file_asset_id: input.fileAssetId,
    file_name: input.fileName,
    mime_type: input.mimeType,
    file_size: input.fileSize,
    client_id: input.clientId,
    fecha_registro: input.fechaRegistro,
    estado_documentacion: input.estadoDocumentacion,
    notas_validacion: input.notasValidacion,
    activo: input.activo,
    contrasena_hash: input.contrasenaHash,
  });
}

export async function createRegistroPeritus(input: RegistroPeritusInput): Promise<PeritusRegistro | null> {
  const id = newId();
  const { text, values } = buildInsert('registro_peritus', { id, ...toColumns(input) });
  await query(text, values);
  return getRegistroById(id);
}

export async function updateRegistroPeritus(
  id: string,
  patch: Partial<RegistroPeritusInput>,
): Promise<PeritusRegistro | null> {
  const upd = buildUpdate('registro_peritus', id, toColumns(patch));
  if (upd) await query(upd.text, upd.values);
  return getRegistroById(id);
}

export async function deleteRegistroPeritus(id: string): Promise<void> {
  await query('DELETE FROM registro_peritus WHERE id = $1', [id]);
}
