import { query, queryOne, nestedObj } from './pool';

export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  totalClients: number;
  totalExperts: number;
  pendingPayments: number;
  casesByStatus: { creado: number; gestionado: number; cancelado: number };
  casesByChannel: Array<{ channel: string; count: number }>;
  commercialPipeline: Array<{ status: string; count: number }>;
  quotesByStatus: Array<{ status: string; count: number }>;
  lossReasons: Array<{ reason: string; count: number }>;
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

  // RF-11: métricas por canal, pipeline comercial, propuestas y motivos de pérdida
  const casesByChannel = await query<{ channel: string; count: number }>(
    `SELECT channel::text AS channel, count(*)::int AS count
     FROM cases GROUP BY channel ORDER BY count DESC`,
  );
  const commercialPipeline = await query<{ status: string; count: number }>(
    `SELECT commercial_status::text AS status, count(*)::int AS count
     FROM cases GROUP BY commercial_status ORDER BY count DESC`,
  );
  const quotesByStatus = await query<{ status: string; count: number }>(
    `SELECT status::text AS status, count(*)::int AS count
     FROM quote GROUP BY status ORDER BY count DESC`,
  );
  const lossReasons = await query<{ reason: string; count: number }>(
    `SELECT reason, count(*)::int AS count FROM (
       SELECT COALESCE(NULLIF(trim(loss_reason), ''), 'Sin motivo registrado') AS reason
       FROM cases WHERE commercial_status = 'perdido'
       UNION ALL
       SELECT COALESCE(NULLIF(trim(rejection_reason), ''), 'Sin motivo registrado') AS reason
       FROM quote WHERE status = 'rechazada'
     ) x GROUP BY reason ORDER BY count DESC LIMIT 10`,
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
    casesByChannel,
    commercialPipeline,
    quotesByStatus,
    lossReasons,
    recentCases,
    totalRevenue: counts?.totalRevenue ?? 0,
    pendingActions: counts?.creado ?? 0,
  };
}
