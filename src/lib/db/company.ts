import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined } from './pool';
import type { Company } from '@/lib/types';

const FULL = `
  id AS "_id", 'company' AS "_type", created_at AS "_createdAt", updated_at AS "_updatedAt",
  name, nit, type, address, city, country, phone, website,
  billing_email AS "billingEmail", logo_url AS "logoUrl", is_active AS "isActive"
`;

export async function listCompanies(): Promise<Company[]> {
  return query<Company>(
    `SELECT id AS "_id", name, nit, type, city, country, phone, is_active AS "isActive"
     FROM company WHERE is_active = TRUE ORDER BY name ASC`,
  );
}

export async function getCompanyById(id: string): Promise<Company | null> {
  return queryOne<Company>(`SELECT ${FULL} FROM company WHERE id = $1`, [id]);
}

export async function searchCompanies(search: string): Promise<Company[]> {
  return query<Company>(
    `SELECT ${FULL} FROM company
     WHERE name ILIKE $1 || '%' OR nit ILIKE $1 || '%'
     ORDER BY name ASC`,
    [search],
  );
}

export interface CompanyInput {
  name: string;
  nit?: string | null;
  type?: Company['type'] | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  website?: string | null;
  billingEmail?: string | null;
  logoUrl?: string | null;
  isActive?: boolean;
}

export async function createCompany(input: CompanyInput): Promise<Company | null> {
  const id = newId();
  const { text, values } = buildInsert('company', {
    id,
    name: input.name,
    nit: input.nit ?? null,
    type: input.type ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    country: input.country ?? 'Colombia',
    phone: input.phone ?? null,
    website: input.website ?? null,
    billing_email: input.billingEmail ?? null,
    logo_url: input.logoUrl ?? null,
    is_active: input.isActive ?? true,
  });
  await query(text, values);
  return getCompanyById(id);
}

export async function updateCompany(id: string, patch: Partial<CompanyInput>): Promise<Company | null> {
  const data = pruneUndefined({
    name: patch.name,
    nit: patch.nit,
    type: patch.type,
    address: patch.address,
    city: patch.city,
    country: patch.country,
    phone: patch.phone,
    website: patch.website,
    billing_email: patch.billingEmail,
    logo_url: patch.logoUrl,
    is_active: patch.isActive,
  });
  const upd = buildUpdate('company', id, data);
  if (upd) await query(upd.text, upd.values);
  return getCompanyById(id);
}

export async function deleteCompany(id: string): Promise<void> {
  await query('DELETE FROM company WHERE id = $1', [id]);
}
