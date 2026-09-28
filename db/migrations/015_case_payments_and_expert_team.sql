-- Normaliza las categorías históricas, añade la tercera fecha de pago y crea
-- la relación N:M de peritos asociados. assigned_expert_id continúa siendo el
-- perito líder para conservar compatibilidad con todos los casos existentes.

BEGIN;

UPDATE case_document
SET category = CASE category::text
  WHEN 'demanda' THEN 'solicitud_dictamen'::document_category
  WHEN 'soporte_tecnico' THEN 'documentos_caso'::document_category
  WHEN 'cotizacion' THEN 'propuesta_comercial'::document_category
  WHEN 'entrega_parcial' THEN 'informe_preliminar'::document_category
  WHEN 'dictamen_final' THEN 'dictamen'::document_category
  WHEN 'pago' THEN 'comprobantes_pago'::document_category
  WHEN 'otro' THEN 'documentos_caso'::document_category
  ELSE category
END
WHERE category::text IN (
  'demanda', 'soporte_tecnico', 'cotizacion', 'entrega_parcial',
  'dictamen_final', 'pago', 'otro'
);

ALTER TABLE quote
  ADD COLUMN IF NOT EXISTS second_payment_date TIMESTAMPTZ;

UPDATE quote
SET second_payment_date = last_payment_date
WHERE second_payment_date IS NULL;

-- Solo se normalizan propuestas cuyos pagos siguen íntegramente pendientes;
-- los pagos ya validados conservan su historia financiera inmutable.
WITH eligible AS (
  SELECT q.id, q.case_id, q.final_value, q.last_payment_date, q.created_by_id
  FROM quote q
  JOIN payment p ON p.quote_id = q.id
  GROUP BY q.id
  HAVING count(*) = 2 AND bool_and(p.status = 'pendiente')
), updated AS (
  UPDATE payment p
  SET percentage = CASE p.payment_number WHEN 1 THEN 50 WHEN 2 THEN 25 END,
      amount = CASE p.payment_number
        WHEN 1 THEN round(e.final_value * 0.50)
        WHEN 2 THEN round(e.final_value * 0.25)
      END,
      updated_at = now()
  FROM eligible e
  WHERE p.quote_id = e.id AND p.payment_number IN (1, 2)
  RETURNING p.quote_id
)
INSERT INTO payment (
  id, case_id, quote_id, payment_number, amount, percentage, due_date,
  status, created_by_id
)
SELECT
  'payment-' || md5(e.id || '-third-payment'), e.case_id, e.id, 3,
  e.final_value - round(e.final_value * 0.50) - round(e.final_value * 0.25),
  25, e.last_payment_date, 'pendiente', e.created_by_id
FROM eligible e
WHERE NOT EXISTS (
  SELECT 1 FROM payment p WHERE p.quote_id = e.id AND p.payment_number = 3
);

UPDATE quote q
SET first_payment_percentage = 50, custom_split = FALSE, updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM payment p WHERE p.quote_id = q.id AND p.payment_number = 3
);

CREATE TABLE IF NOT EXISTS case_associated_expert (
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES crm_user(id) ON DELETE CASCADE,
  assigned_by_id TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (case_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_case_associated_expert_user
  ON case_associated_expert (user_id, case_id);

COMMIT;
