-- ============================================================================
-- CNP | PERITUS — Portales seguros de perito y cliente final (G-01..G-22)
--
-- Migración aditiva e idempotente. Los nuevos valores de enum se confirman en
-- 008 antes de que esta migración los use para normalizar tipos de cliente.
-- ============================================================================

BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_message_audience') THEN
    CREATE TYPE case_message_audience AS ENUM ('juridico_perito', 'juridico_cliente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_request_status') THEN
    CREATE TYPE document_request_status AS ENUM ('solicitada', 'atendida', 'cancelada');
  END IF;
END $$;

-- G-01: titular y documento son distintos del NIT/cédula fiscal del perito.
ALTER TABLE expert
  ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS bank_holder_document TEXT;

-- G-02: nombres inequívocos en las nuevas altas.
UPDATE crm_client SET client_type = 'persona_natural' WHERE client_type = 'particular';
UPDATE crm_client SET client_type = 'abogado_externo' WHERE client_type = 'abogado';
ALTER TABLE crm_client ALTER COLUMN client_type SET DEFAULT 'persona_natural';

-- G-06/G-11: abogado interlocutor y reloj cotizado que puede congelarse.
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS assigned_juridico_id TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS execution_business_days INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS execution_suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS execution_remaining_business_days INTEGER,
  ADD COLUMN IF NOT EXISTS execution_state TEXT NOT NULL DEFAULT 'no_iniciada';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cases_execution_state_check'
  ) THEN
    ALTER TABLE cases ADD CONSTRAINT cases_execution_state_check
      CHECK (execution_state IN ('no_iniciada', 'activa', 'suspendida', 'finalizada'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cases_assigned_juridico ON cases (assigned_juridico_id);
CREATE INDEX IF NOT EXISTS idx_cases_execution_state ON cases (execution_state);

-- Asigna como jurídico al primer actor jurídico ya relacionado con el caso.
UPDATE cases c
SET assigned_juridico_id = (
  SELECT u.id
  FROM crm_user u
  WHERE u.role = 'juridico'
    AND u.id IN (c.created_by_id, c.commercial_id, c.technical_analyst_id)
  ORDER BY CASE
    WHEN u.id = c.created_by_id THEN 1
    WHEN u.id = c.technical_analyst_id THEN 2
    ELSE 3
  END
  LIMIT 1
)
WHERE c.assigned_juridico_id IS NULL
  AND EXISTS (
    SELECT 1 FROM crm_user u
    WHERE u.role = 'juridico'
      AND u.id IN (c.created_by_id, c.commercial_id, c.technical_analyst_id)
  );

UPDATE cases
SET execution_state = CASE
  WHEN execution_start_date IS NULL THEN 'no_iniciada'
  ELSE 'activa'
END
WHERE execution_state = 'no_iniciada';

ALTER TABLE quote ADD COLUMN IF NOT EXISTS quoted_business_days INTEGER;
UPDATE quote SET quoted_business_days = 15 WHERE quoted_business_days IS NULL;
ALTER TABLE quote ALTER COLUMN quoted_business_days SET DEFAULT 15;
ALTER TABLE quote ALTER COLUMN quoted_business_days SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quote_business_days_check'
  ) THEN
    ALTER TABLE quote ADD CONSTRAINT quote_business_days_check
      CHECK (quoted_business_days BETWEEN 1 AND 365);
  END IF;
END $$;

-- Antes del primer pago, el caso ya muestra el plazo de su última propuesta
-- aprobada; al arrancar la ejecución se vuelve a fijar de forma idempotente.
UPDATE cases c
SET execution_business_days = COALESCE((
  SELECT q.quoted_business_days
  FROM quote q
  WHERE q.case_id = c.id AND q.status = 'aprobada'
  ORDER BY q.approved_at DESC NULLS LAST, q.version DESC
  LIMIT 1
), 15)
WHERE c.execution_start_date IS NULL;

-- G-07: actividades históricas creadas desde la ficha del caso no siempre
-- guardaban work_plan_id; enlazarlas restaura el progreso global del plan.
UPDATE work_plan_activity activity
SET work_plan_id = (
  SELECT plan.id FROM work_plan plan
  WHERE plan.case_id = activity.case_id
  ORDER BY plan.created_at DESC LIMIT 1
)
WHERE activity.work_plan_id IS NULL
  AND EXISTS (SELECT 1 FROM work_plan plan WHERE plan.case_id = activity.case_id);

-- G-08: anexos independientes del PDF principal del dictamen.
CREATE TABLE IF NOT EXISTS deliverable_attachment (
  id              TEXT PRIMARY KEY,
  deliverable_id  TEXT NOT NULL REFERENCES deliverable(id) ON DELETE CASCADE,
  file_url        TEXT NOT NULL,
  file_asset_id   TEXT,
  file_name       TEXT NOT NULL,
  mime_type       TEXT,
  file_size       BIGINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deliverable_attachment_deliverable
  ON deliverable_attachment (deliverable_id, created_at ASC);

-- G-12: soporte del pago del servicio propio del perito.
ALTER TABLE commission
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_asset_id TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- G-10: solicitud formal dirigida al abogado, nunca al cliente.
CREATE TABLE IF NOT EXISTS document_request (
  id                    TEXT PRIMARY KEY,
  case_id               TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  requested_by_id       TEXT NOT NULL REFERENCES crm_user(id) ON DELETE CASCADE,
  assigned_juridico_id  TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  description           TEXT NOT NULL,
  status                document_request_status NOT NULL DEFAULT 'solicitada',
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_document_request_case
  ON document_request (case_id, created_at DESC);

-- G-20: cada fila pertenece a UNA audiencia. No existe hilo compartido.
CREATE TABLE IF NOT EXISTS case_message (
  id                TEXT PRIMARY KEY,
  case_id           TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  audience          case_message_audience NOT NULL,
  sender_id         TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  sender_name       TEXT NOT NULL,
  sender_role       user_role NOT NULL,
  body              TEXT NOT NULL,
  attachment_url    TEXT,
  attachment_asset_id TEXT,
  attachment_name   TEXT,
  attachment_mime_type TEXT,
  attachment_size   BIGINT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_message_thread
  ON case_message (case_id, audience, created_at ASC);
ALTER TABLE case_message ALTER COLUMN sender_id DROP NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'case_message_audience_role_check'
  ) THEN
    ALTER TABLE case_message ADD CONSTRAINT case_message_audience_role_check CHECK (
      sender_role IN ('admin', 'juridico')
      OR (sender_role = 'perito' AND audience = 'juridico_perito')
      OR (sender_role = 'cliente' AND audience = 'juridico_cliente')
    );
  END IF;
END $$;

-- G-18: auditoría de quién aportó el comprobante del cliente.
ALTER TABLE payment
  ADD COLUMN IF NOT EXISTS receipt_uploaded_by_id TEXT REFERENCES crm_user(id) ON DELETE SET NULL;

-- G-15: cuentas publicables por marca (JSON o texto descriptivo).
INSERT INTO system_setting (id, key, value, data_type, description) VALUES
  ('setting-payment-account-cnp', 'payment_account_cnp', '', 'json', 'Cuenta de CNP visible para el pago del cliente final'),
  ('setting-payment-account-peritus', 'payment_account_peritus', '', 'json', 'Cuenta de PERITUS visible para el pago del cliente final')
ON CONFLICT (key) DO NOTHING;

-- Triggers para las tablas nuevas (se crean una sola vez).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_deliverable_attachment_updated_at') THEN
    CREATE TRIGGER trg_deliverable_attachment_updated_at
      BEFORE UPDATE ON deliverable_attachment FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_document_request_updated_at') THEN
    CREATE TRIGGER trg_document_request_updated_at
      BEFORE UPDATE ON document_request FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_case_message_updated_at') THEN
    CREATE TRIGGER trg_case_message_updated_at
      BEFORE UPDATE ON case_message FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

COMMIT;
