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
  clientGrowthByMonth: Array<{ date: string; value: number }>;
  clientRegistrationsByDay: Array<{ date: string; value: number }>;
  caseRegistrationsByDay: Array<{
    date: string;
    brand: 'CNP' | 'Peritus';
    total: number;
    upcoming: number;
    urgent: number;
  }>;
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

  const clientGrowthByMonth = await query<{ date: string; value: number }>(
    `WITH bounds AS (
       SELECT
         COALESCE(
           date_trunc('month', min(created_at AT TIME ZONE 'America/Bogota')) - interval '1 month',
           date_trunc('month', now() AT TIME ZONE 'America/Bogota')
         ) AS first_month,
         date_trunc('month', now() AT TIME ZONE 'America/Bogota') AS current_month
       FROM crm_client
     ), months AS (
       SELECT generate_series(first_month, current_month, interval '1 month') AS month
       FROM bounds
     ), monthly_counts AS (
       SELECT
         date_trunc('month', created_at AT TIME ZONE 'America/Bogota') AS month,
         count(*)::int AS value
       FROM crm_client
       GROUP BY 1
     )
     SELECT
       to_char(months.month, 'YYYY-MM') AS date,
       COALESCE(
         sum(COALESCE(monthly_counts.value, 0)) OVER (ORDER BY months.month),
         0
       )::int AS value
     FROM months
     LEFT JOIN monthly_counts ON monthly_counts.month = months.month
     ORDER BY months.month`,
  );

  const clientRegistrationsByDay = await query<{ date: string; value: number }>(
    `WITH days AS (
       SELECT generate_series(
         (now() AT TIME ZONE 'America/Bogota')::date - 179,
         (now() AT TIME ZONE 'America/Bogota')::date,
         interval '1 day'
       )::date AS day
     ), daily_counts AS (
       SELECT
         (created_at AT TIME ZONE 'America/Bogota')::date AS day,
         count(*)::int AS value
       FROM crm_client
       WHERE created_at >= now() - interval '180 days'
       GROUP BY 1
     )
     SELECT
       to_char(days.day, 'YYYY-MM-DD') AS date,
       COALESCE(daily_counts.value, 0)::int AS value
     FROM days
     LEFT JOIN daily_counts ON daily_counts.day = days.day
     ORDER BY days.day`,
  );

  const caseRegistrationsByDay = await query<DashboardStats['caseRegistrationsByDay'][number]>(
    `WITH bounds AS (
       SELECT
         COALESCE(
           min(created_at AT TIME ZONE 'America/Bogota')::date,
           (now() AT TIME ZONE 'America/Bogota')::date
         ) AS first_day,
         (now() AT TIME ZONE 'America/Bogota')::date AS current_day
       FROM cases
       WHERE status <> 'archivado'
     ), days AS (
       SELECT generate_series(first_day, current_day, interval '1 day')::date AS day
       FROM bounds
     ), brands AS (
       SELECT unnest(ARRAY['CNP', 'Peritus']) AS brand
     )
     SELECT
       to_char(days.day, 'YYYY-MM-DD') AS date,
       brands.brand AS brand,
       count(c.id)::int AS total,
       count(c.id) FILTER (
         WHERE c.deadline_date IS NOT NULL
           AND c.deadline_date <= now() + interval '30 days'
           AND c.status <> 'cancelado'
       )::int AS upcoming,
       count(c.id) FILTER (
         WHERE c.deadline_date IS NOT NULL
           AND c.deadline_date <= now() + interval '7 days'
           AND c.status <> 'cancelado'
       )::int AS urgent
     FROM days
     CROSS JOIN brands
     LEFT JOIN cases c
       ON (c.created_at AT TIME ZONE 'America/Bogota')::date = days.day
      AND c.brand::text = brands.brand
      AND c.status <> 'archivado'
     GROUP BY days.day, brands.brand
     ORDER BY days.day, brands.brand`,
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
    clientGrowthByMonth,
    clientRegistrationsByDay,
    caseRegistrationsByDay,
  };
}

/** Dashboard sin métricas de clientes, cotizaciones ni pagos. */
export async function getCaseOnlyDashboardStats(assignedFinancieroId = ''): Promise<DashboardStats> {
  const counts = await queryOne<{
    totalCases: number; activeCases: number; creado: number; gestionado: number; cancelado: number;
  }>(
    `SELECT
       count(*)::int AS "totalCases",
       count(*) FILTER (WHERE status = 'gestionado')::int AS "activeCases",
       count(*) FILTER (WHERE status = 'creado')::int AS creado,
       count(*) FILTER (WHERE status = 'gestionado')::int AS gestionado,
       count(*) FILTER (WHERE status = 'cancelado')::int AS cancelado
     FROM cases
     WHERE status <> 'archivado' AND ($1 = '' OR assigned_financiero_id = $1)`,
    [assignedFinancieroId],
  );

  const recentCases = await query<DashboardStats['recentCases'][number]>(
    `SELECT id AS "_id", case_code AS "caseCode", title, status, discipline,
       created_at AS "_createdAt", NULL::jsonb AS client
     FROM cases
     WHERE status <> 'archivado' AND ($1 = '' OR assigned_financiero_id = $1)
     ORDER BY created_at DESC LIMIT 5`,
    [assignedFinancieroId],
  );

  const caseRegistrationsByDay = await query<DashboardStats['caseRegistrationsByDay'][number]>(
    `WITH bounds AS (
       SELECT COALESCE(min(created_at AT TIME ZONE 'America/Bogota')::date,
         (now() AT TIME ZONE 'America/Bogota')::date) AS first_day,
         (now() AT TIME ZONE 'America/Bogota')::date AS current_day
       FROM cases
       WHERE status <> 'archivado' AND ($1 = '' OR assigned_financiero_id = $1)
     ), days AS (
       SELECT generate_series(first_day, current_day, interval '1 day')::date AS day FROM bounds
     ), brands AS (
       SELECT unnest(ARRAY['CNP', 'Peritus']) AS brand
     )
     SELECT to_char(days.day, 'YYYY-MM-DD') AS date, brands.brand AS brand,
       count(c.id)::int AS total,
       count(c.id) FILTER (WHERE c.deadline_date IS NOT NULL
         AND c.deadline_date <= now() + interval '30 days' AND c.status <> 'cancelado')::int AS upcoming,
       count(c.id) FILTER (WHERE c.deadline_date IS NOT NULL
         AND c.deadline_date <= now() + interval '7 days' AND c.status <> 'cancelado')::int AS urgent
     FROM days CROSS JOIN brands
     LEFT JOIN cases c ON (c.created_at AT TIME ZONE 'America/Bogota')::date = days.day
       AND c.brand::text = brands.brand AND c.status <> 'archivado'
       AND ($1 = '' OR c.assigned_financiero_id = $1)
     GROUP BY days.day, brands.brand ORDER BY days.day, brands.brand`,
    [assignedFinancieroId],
  );

  return {
    totalCases: counts?.totalCases ?? 0,
    activeCases: counts?.activeCases ?? 0,
    totalClients: 0,
    totalExperts: 0,
    pendingPayments: 0,
    casesByStatus: {
      creado: counts?.creado ?? 0,
      gestionado: counts?.gestionado ?? 0,
      cancelado: counts?.cancelado ?? 0,
    },
    casesByChannel: [], commercialPipeline: [], quotesByStatus: [], lossReasons: [],
    recentCases, totalRevenue: 0, pendingActions: counts?.creado ?? 0,
    clientGrowthByMonth: [], clientRegistrationsByDay: [], caseRegistrationsByDay,
  };
}
