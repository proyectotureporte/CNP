import { query, queryOne, nestedObj } from './pool';

export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  totalClients: number;
  totalExperts: number;
  pendingPayments: number;
  casesByStatus: { creado: number; gestionado: number; cancelado: number };
  recentCases: Array<{
    _id: string;
    caseCode: string;
    title: string;
    status: string;
    discipline: string;
    _createdAt: string;
    client: { _id: string; name: string } | null;
  }>;
  totalRevenue: number;
  pendingActions: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const counts = await queryOne<{
    totalCases: number;
    activeCases: number;
    totalClients: number;
    totalExperts: number;
    pendingPayments: number;
    creado: number;
    gestionado: number;
    cancelado: number;
    totalRevenue: number;
  }>(
    `SELECT
       (SELECT count(*) FROM cases)::int AS "totalCases",
       (SELECT count(*) FROM cases WHERE status = 'gestionado')::int AS "activeCases",
       (SELECT count(*) FROM crm_client)::int AS "totalClients",
       (SELECT count(*) FROM expert WHERE validation_status = 'activado')::int AS "totalExperts",
       (SELECT count(*) FROM payment WHERE status = 'pendiente')::int AS "pendingPayments",
       (SELECT count(*) FROM cases WHERE status = 'creado')::int AS creado,
       (SELECT count(*) FROM cases WHERE status = 'gestionado')::int AS gestionado,
       (SELECT count(*) FROM cases WHERE status = 'cancelado')::int AS cancelado,
       COALESCE((SELECT sum(amount) FROM payment WHERE status = 'validado'), 0)::float8 AS "totalRevenue"`,
  );

  const recentCases = await query<DashboardStats['recentCases'][number]>(
    `SELECT c.id AS "_id", c.case_code AS "caseCode", c.title, c.status, c.discipline, c.created_at AS "_createdAt",
       ${nestedObj('cl', { _id: 'cl.id', name: 'cl.name' })} AS "client"
     FROM cases c LEFT JOIN crm_client cl ON cl.id = c.client_id
     ORDER BY c.created_at DESC LIMIT 5`,
  );

  return {
    totalCases: counts?.totalCases ?? 0,
    activeCases: counts?.activeCases ?? 0,
    totalClients: counts?.totalClients ?? 0,
    totalExperts: counts?.totalExperts ?? 0,
    pendingPayments: counts?.pendingPayments ?? 0,
    casesByStatus: {
      creado: counts?.creado ?? 0,
      gestionado: counts?.gestionado ?? 0,
      cancelado: counts?.cancelado ?? 0,
    },
    recentCases,
    totalRevenue: counts?.totalRevenue ?? 0,
    pendingActions: counts?.creado ?? 0,
  };
}
