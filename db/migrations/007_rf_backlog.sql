-- ============================================================================
-- Migración 007_rf_backlog — Backlog RF-01..RF-14 + calidad de datos
--
--   * Canal de origen y pipeline comercial separado del estado técnico (RF-01/18/11)
--   * Checklist documental con estado por documento (RF-05/16)
--   * Comité: tabla committee_review (RF-07)
--   * Cotizaciones: canal, versionado con padre, seguimiento (RF-09/10)
--   * Cliente: tipología (abogado/empresa/juez/particular) + FK crm_user→crm_client (RF-14)
--   * Ejecución: reloj de 15 días hábiles tras pago validado (item 20)
--   * Correos por tipo de destinatario en system_setting (item 17)
-- ============================================================================

BEGIN;

-- ── ENUMS nuevos ─────────────────────────────────────────────────────────────
CREATE TYPE case_channel         AS ENUM ('web','whatsapp','referido','directo','masterclass','otro');
CREATE TYPE commercial_status    AS ENUM ('prospecto','en_analisis','propuesta_enviada','negociacion','ganado','perdido');
CREATE TYPE case_document_status AS ENUM ('no_recibido','parcial','recibido');
CREATE TYPE quote_channel        AS ENUM ('email','whatsapp','presencial','otro');
CREATE TYPE client_type          AS ENUM ('abogado','empresa','juez','particular');
CREATE TYPE committee_viability  AS ENUM ('viable','no_viable','condicionada');

-- Nota: no usar 'follow_up' dentro de esta misma transacción (regla de PG).
ALTER TYPE case_event_type ADD VALUE IF NOT EXISTS 'follow_up';
ALTER TYPE case_event_type ADD VALUE IF NOT EXISTS 'committee_decision';
ALTER TYPE case_event_type ADD VALUE IF NOT EXISTS 'execution_started';

-- ── cases: canal, pipeline comercial y reloj de ejecución ────────────────────
ALTER TABLE cases
  ADD COLUMN channel              case_channel      NOT NULL DEFAULT 'directo',
  ADD COLUMN commercial_status    commercial_status NOT NULL DEFAULT 'prospecto',
  ADD COLUMN loss_reason          TEXT,
  ADD COLUMN execution_start_date TIMESTAMPTZ,
  ADD COLUMN execution_deadline   TIMESTAMPTZ;

CREATE INDEX idx_cases_channel           ON cases (channel);
CREATE INDEX idx_cases_commercial_status ON cases (commercial_status);

-- Backfill de canal: clientes convertidos desde WhatsApp
UPDATE cases SET channel = 'whatsapp'
WHERE client_id IN (SELECT converted_client_id FROM whatsapp_lead WHERE converted_client_id IS NOT NULL);

-- Backfill de pipeline comercial a partir del histórico de cotizaciones/estado
UPDATE cases SET commercial_status = 'propuesta_enviada'
WHERE id IN (SELECT DISTINCT case_id FROM quote WHERE status = 'enviada');
UPDATE cases SET commercial_status = 'ganado'
WHERE id IN (SELECT DISTINCT case_id FROM quote WHERE status = 'aprobada');
UPDATE cases SET commercial_status = 'perdido',
                 loss_reason = COALESCE(loss_reason, 'Histórico: caso cancelado antes de la migración 007')
WHERE status = 'cancelado';

-- ── case_document: checklist con estado (los adjuntos pasan a ser opcionales) ─
ALTER TABLE case_document
  ADD COLUMN status      case_document_status NOT NULL DEFAULT 'recibido',
  ADD COLUMN is_required BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_case_document_status ON case_document (status);

-- ── quote: canal de envío, versionado con padre y seguimiento comercial ──────
ALTER TABLE quote
  ADD COLUMN channel              quote_channel,
  ADD COLUMN parent_quote_id      TEXT REFERENCES quote(id) ON DELETE SET NULL,
  ADD COLUMN next_follow_up_date  TIMESTAMPTZ,
  ADD COLUMN acceptance_notes     TEXT;
CREATE INDEX idx_quote_parent    ON quote (parent_quote_id);
CREATE INDEX idx_quote_follow_up ON quote (next_follow_up_date) WHERE next_follow_up_date IS NOT NULL;

-- ── crm_client: tipología + vínculo FK real usuario-portal ↔ cliente ─────────
ALTER TABLE crm_client ADD COLUMN client_type client_type NOT NULL DEFAULT 'particular';
ALTER TABLE crm_user   ADD COLUMN client_id TEXT REFERENCES crm_client(id) ON DELETE SET NULL;
CREATE INDEX idx_crm_user_client ON crm_user (client_id);

-- Backfill del vínculo por email (mismo criterio que usaba clientAccess: el más antiguo)
UPDATE crm_user u SET client_id = c.id
FROM (
  SELECT DISTINCT ON (lower(email)) id, lower(email) AS email
  FROM crm_client WHERE email IS NOT NULL
  ORDER BY lower(email), created_at ASC
) c
WHERE u.role = 'cliente' AND u.client_id IS NULL AND lower(u.email) = c.email;

-- ── committee_review: decisión de comité por caso (RF-07) ────────────────────
CREATE TABLE committee_review (
  id                       TEXT PRIMARY KEY,
  case_id                  TEXT NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
  viability                committee_viability,
  viability_reason         TEXT,
  scope                    TEXT,
  fees                     NUMERIC(15,2),
  deliverables_description TEXT,
  estimated_days           INTEGER,
  notes                    TEXT,
  decided_by_id            TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  decided_at               TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_committee_review_updated_at BEFORE UPDATE ON committee_review FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── system_setting: buzones por tipo de destinatario (item 17) ───────────────
INSERT INTO system_setting (id, key, value, data_type, description) VALUES
  ('setting-email-admin',          'email_admin',          '', 'string', 'Buzón del administrador para alertas internas'),
  ('setting-email-comite',         'email_comite',         '', 'string', 'Buzón del comité (planes de trabajo, decisiones)'),
  ('setting-email-comunicaciones', 'email_comunicaciones', '', 'string', 'Buzón de comunicaciones (leads y formularios web)')
ON CONFLICT (key) DO NOTHING;

COMMIT;
