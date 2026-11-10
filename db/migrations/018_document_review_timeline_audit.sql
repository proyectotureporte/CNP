-- ============================================================================
-- CNP | PERITUS — revisión documental con versiones, actuaciones visibles para
-- el cliente y trazabilidad por caso.
--
-- 1. case_document: estado de revisión (pendiente_revision / aprobado /
--    requiere_correccion), observación, revisor, y cadena de versiones
--    (supersedes_document_id / superseded_at).
-- 2. case_event: título, fecha de la actuación, visibilidad para el cliente y
--    documento de soporte.
-- 3. audit_log: case_id para consultar la trazabilidad de un expediente.
-- ============================================================================

BEGIN;

-- 1. Revisión documental ------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_document_review_status') THEN
    CREATE TYPE case_document_review_status AS ENUM ('pendiente_revision', 'aprobado', 'requiere_correccion');
  END IF;
END $$;

ALTER TABLE case_document
  ADD COLUMN IF NOT EXISTS review_status case_document_review_status,
  ADD COLUMN IF NOT EXISTS review_note TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by_id TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by_name TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supersedes_document_id TEXT REFERENCES case_document(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMPTZ;

-- Histórico: lo cargado por el equipo queda aprobado; lo recibido del cliente o
-- de un perito externo (sin usuario interno) queda pendiente de revisión.
UPDATE case_document
SET review_status = CASE
  WHEN upload_link_id IS NOT NULL OR uploaded_by_id IS NULL THEN 'pendiente_revision'::case_document_review_status
  ELSE 'aprobado'::case_document_review_status
END
WHERE file_url IS NOT NULL AND review_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_case_document_review
  ON case_document (case_id, review_status) WHERE superseded_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_case_document_supersedes
  ON case_document (supersedes_document_id) WHERE supersedes_document_id IS NOT NULL;

-- 2. Actuaciones del caso -----------------------------------------------------
ALTER TABLE case_event
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_visible_to_client BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS document_id TEXT REFERENCES case_document(id) ON DELETE SET NULL;

UPDATE case_event SET event_date = created_at WHERE event_date IS NULL;
ALTER TABLE case_event ALTER COLUMN event_date SET DEFAULT now();

-- Visibilidad inicial: los hitos del proceso se muestran; las notas internas,
-- asignaciones de peritos, mensajes de hilos y decisiones de comité no.
UPDATE case_event
SET is_visible_to_client = TRUE
WHERE event_type::text IN (
  'case_created', 'status_changed', 'quote_created', 'quote_approved', 'quote_rejected',
  'deliverable_approved', 'payment_recorded', 'payment_receipt_uploaded',
  'document_requested', 'document_uploaded',
  'execution_started', 'execution_suspended', 'execution_resumed'
);

CREATE INDEX IF NOT EXISTS idx_case_event_client_visible
  ON case_event (case_id, event_date DESC) WHERE is_visible_to_client = TRUE;

-- 3. Trazabilidad por caso ----------------------------------------------------
ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS case_id TEXT REFERENCES cases(id) ON DELETE SET NULL;

UPDATE audit_log SET case_id = entity_id
WHERE case_id IS NULL AND entity_type = 'case'
  AND EXISTS (SELECT 1 FROM cases c WHERE c.id = audit_log.entity_id);

UPDATE audit_log a SET case_id = d.case_id
FROM case_document d
WHERE a.case_id IS NULL AND a.entity_type = 'case_document' AND d.id = a.entity_id;

CREATE INDEX IF NOT EXISTS idx_audit_log_case ON audit_log (case_id, created_at DESC) WHERE case_id IS NOT NULL;

COMMIT;
