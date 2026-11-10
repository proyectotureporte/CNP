-- ============================================================================
-- CNP | PERITUS — rol ABOGADO (visibilidad sin intervención) y relación N:M
-- abogado ↔ caso. El abogado entra por el portal, ve sus casos, el seguimiento
-- visible, los documentos autorizados y los entregables aprobados, y aporta
-- documentos solicitados. Nunca ve peritos, cotizaciones ni pagos.
--
-- ALTER TYPE ... ADD VALUE no puede ir dentro de la misma transacción que lo
-- usa, por eso este archivo no abre BEGIN/COMMIT (igual que la migración 014).
-- ============================================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'abogado';

CREATE TABLE IF NOT EXISTS case_lawyer (
  case_id        TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id        TEXT NOT NULL REFERENCES crm_user(id) ON DELETE CASCADE,
  created_by_id  TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (case_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_case_lawyer_user ON case_lawyer (user_id, created_at DESC);
