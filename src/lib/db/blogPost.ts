import { query, queryOne, newId } from './pool';

export interface BlogPost {
  _id: string;
  slug: string;
  titulo: string;
  extracto: string;
  categoria: string;
  imagenUrl: string;
  contenidoHtml: string;
  tags: string[];
  publicado: boolean;
  fechaPublicacion: string;
  _createdAt: string;
  updatedAt: string;
}

const SELECT = `
  id AS "_id", slug, titulo, extracto, categoria,
  imagen_url AS "imagenUrl", contenido_html AS "contenidoHtml",
  tags, publicado, fecha_publicacion AS "fechaPublicacion",
  created_at AS "_createdAt", updated_at AS "updatedAt"
`;

/** Slug URL-safe desde el título (minúsculas, sin tildes, guiones). */
export function slugify(titulo: string): string {
  return titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'entrada';
}

/** Slug único: si ya existe, añade -2, -3… */
export async function slugUnico(titulo: string, excluirId?: string): Promise<string> {
  const base = slugify(titulo);
  let candidato = base;
  for (let i = 2; i < 100; i++) {
    const existente = await queryOne<{ id: string }>(
      `SELECT id FROM blog_post WHERE slug = $1 AND ($2 = '' OR id <> $2) LIMIT 1`,
      [candidato, excluirId ?? ''],
    );
    if (!existente) return candidato;
    candidato = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/** Publicados, más recientes primero. limit=0 → todos. */
export async function listPublicados(limit = 0): Promise<BlogPost[]> {
  return query<BlogPost>(
    `SELECT ${SELECT} FROM blog_post
      WHERE publicado = TRUE
      ORDER BY fecha_publicacion DESC
      ${limit > 0 ? 'LIMIT ' + Math.floor(limit) : ''}`,
  );
}

/** Los N posts para las tarjetas de /masterclass (publicados o no — las
 *  tarjetas "Próximamente" también se muestran, sin enlace). */
export async function listParaTarjetas(limit = 4): Promise<BlogPost[]> {
  return query<BlogPost>(
    `SELECT ${SELECT} FROM blog_post
      ORDER BY publicado DESC, fecha_publicacion DESC
      LIMIT $1`,
    [Math.max(1, Math.floor(limit))],
  );
}

export async function listTodos(): Promise<BlogPost[]> {
  return query<BlogPost>(
    `SELECT ${SELECT} FROM blog_post ORDER BY fecha_publicacion DESC`,
  );
}

export async function getBySlug(slug: string): Promise<BlogPost | null> {
  return queryOne<BlogPost>(`SELECT ${SELECT} FROM blog_post WHERE slug = $1`, [slug]);
}

export async function getById(id: string): Promise<BlogPost | null> {
  return queryOne<BlogPost>(`SELECT ${SELECT} FROM blog_post WHERE id = $1`, [id]);
}

export interface BlogPostInput {
  titulo: string;
  extracto?: string;
  categoria?: string;
  imagenUrl?: string;
  contenidoHtml?: string;
  tags?: string[];
  publicado?: boolean;
  fechaPublicacion?: string | null;
}

export async function createPost(input: BlogPostInput): Promise<BlogPost> {
  const id = newId();
  const slug = await slugUnico(input.titulo);
  const row = await queryOne<BlogPost>(
    `INSERT INTO blog_post
       (id, slug, titulo, extracto, categoria, imagen_url, contenido_html, tags, publicado, fecha_publicacion)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, COALESCE($10::timestamptz, now()))
     RETURNING ${SELECT}`,
    [
      id,
      slug,
      input.titulo,
      input.extracto ?? '',
      input.categoria ?? 'Análisis financiero',
      input.imagenUrl ?? '',
      input.contenidoHtml ?? '',
      JSON.stringify(input.tags ?? []),
      input.publicado ?? false,
      input.fechaPublicacion ?? null,
    ],
  );
  return row as BlogPost;
}

export async function updatePost(id: string, input: BlogPostInput): Promise<BlogPost | null> {
  const actual = await getById(id);
  if (!actual) return null;
  // Si cambió el título, regenerar slug automáticamente (manteniendo unicidad).
  const slug = input.titulo && input.titulo !== actual.titulo
    ? await slugUnico(input.titulo, id)
    : actual.slug;
  const row = await queryOne<BlogPost>(
    `UPDATE blog_post SET
       slug = $2, titulo = $3, extracto = $4, categoria = $5,
       imagen_url = $6, contenido_html = $7, tags = $8::jsonb,
       publicado = $9, fecha_publicacion = COALESCE($10::timestamptz, fecha_publicacion)
     WHERE id = $1
     RETURNING ${SELECT}`,
    [
      id,
      slug,
      input.titulo ?? actual.titulo,
      input.extracto ?? actual.extracto,
      input.categoria ?? actual.categoria,
      input.imagenUrl ?? actual.imagenUrl,
      input.contenidoHtml ?? actual.contenidoHtml,
      JSON.stringify(input.tags ?? actual.tags ?? []),
      input.publicado ?? actual.publicado,
      input.fechaPublicacion ?? null,
    ],
  );
  return row;
}

export async function deletePost(id: string): Promise<boolean> {
  const res = await query(`DELETE FROM blog_post WHERE id = $1 RETURNING id`, [id]);
  return res.length > 0;
}

/** Otros posts publicados distintos al slug dado (para "relacionados"). */
export async function listRelacionados(slug: string, limit = 3): Promise<BlogPost[]> {
  return query<BlogPost>(
    `SELECT ${SELECT} FROM blog_post
      WHERE slug <> $1
      ORDER BY publicado DESC, fecha_publicacion DESC
      LIMIT $2`,
    [slug, Math.max(1, Math.floor(limit))],
  );
}
