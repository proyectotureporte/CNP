import { query, queryOne } from './pool';

export interface SiteContentRow {
  site: string;
  page: string;
  valor: Record<string, unknown>;
  updatedAt: string;
}

const SELECT = `site, page, valor, updated_at AS "updatedAt"`;

export async function getSiteContent(site: string, page: string): Promise<SiteContentRow | null> {
  return queryOne<SiteContentRow>(
    `SELECT ${SELECT} FROM site_content WHERE site = $1 AND page = $2`,
    [site, page],
  );
}

export async function setSiteContent(
  site: string,
  page: string,
  valor: Record<string, unknown>,
): Promise<SiteContentRow> {
  const row = await queryOne<SiteContentRow>(
    `INSERT INTO site_content (site, page, valor, updated_at)
     VALUES ($1, $2, $3::jsonb, now())
     ON CONFLICT (site, page)
     DO UPDATE SET valor = EXCLUDED.valor, updated_at = now()
     RETURNING ${SELECT}`,
    [site, page, JSON.stringify(valor ?? {})],
  );
  return row as SiteContentRow;
}

export async function listSiteContent(site: string): Promise<SiteContentRow[]> {
  return query<SiteContentRow>(
    `SELECT ${SELECT} FROM site_content WHERE site = $1 ORDER BY page`,
    [site],
  );
}
