-- Separa la fecha de carga del comprobante de la fecha real de pago.
-- Los comprobantes pendientes históricos estaban usando payment_date para la
-- carga; se corrigen sin alterar la fecha de pagos ya validados.

BEGIN;

ALTER TABLE payment
  ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMPTZ;

UPDATE payment
SET receipt_uploaded_at = COALESCE(receipt_uploaded_at, payment_date, updated_at),
    payment_date = NULL
WHERE status = 'pendiente' AND file_url IS NOT NULL;

UPDATE payment
SET receipt_uploaded_at = COALESCE(receipt_uploaded_at, payment_date, updated_at)
WHERE status = 'validado' AND file_url IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_case_version_unique
  ON quote (case_id, version);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_quote_number_unique
  ON payment (quote_id, payment_number)
  WHERE quote_id IS NOT NULL AND payment_number IS NOT NULL;

COMMIT;
