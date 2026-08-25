-- CNP | PERITUS — RBAC definitivo: cuatro roles internos y dos externos.
-- Elimina los roles históricos también del enum, no solo del frontend.
BEGIN;

ALTER TABLE case_message DROP CONSTRAINT IF EXISTS case_message_audience_role_check;
ALTER TABLE crm_user ALTER COLUMN role DROP DEFAULT;

UPDATE crm_user SET role = 'comercial_juridico'
WHERE role::text IN ('juridico', 'administrativo', 'mercadeo', 'postventa');

UPDATE crm_user SET role = 'perito_interno'
WHERE role::text IN ('financiero', 'tecnico');

UPDATE case_message SET sender_role = 'comercial_juridico'
WHERE sender_role::text IN ('juridico', 'administrativo', 'mercadeo', 'postventa');

UPDATE case_message SET sender_role = 'perito_interno'
WHERE sender_role::text IN ('financiero', 'tecnico');

UPDATE cases SET status_changed_by_role = 'comercial_juridico'
WHERE status_changed_by_role IN ('juridico', 'administrativo', 'mercadeo', 'postventa');

UPDATE cases SET status_changed_by_role = 'perito_interno'
WHERE status_changed_by_role IN ('financiero', 'tecnico');

-- Completa el interlocutor de casos históricos ahora que los tres equipos
-- comerciales quedaron unificados en un solo rol.
UPDATE cases c
SET assigned_juridico_id = (
  SELECT u.id
  FROM crm_user u
  WHERE u.role::text = 'comercial_juridico'
    AND u.id IN (c.created_by_id, c.commercial_id, c.technical_analyst_id)
  ORDER BY CASE
    WHEN u.id = c.created_by_id THEN 1
    WHEN u.id = c.commercial_id THEN 2
    ELSE 3
  END
  LIMIT 1
)
WHERE c.assigned_juridico_id IS NULL
  AND EXISTS (
    SELECT 1 FROM crm_user u
    WHERE u.role::text = 'comercial_juridico'
      AND u.id IN (c.created_by_id, c.commercial_id, c.technical_analyst_id)
  );

-- Las cinco cuentas de portal sin cliente relacionado no deben poder entrar.
-- Se desactivan, no se borran, para conservar auditoría y permitir reversión.
UPDATE crm_user SET active = FALSE, updated_at = now()
WHERE role::text = 'cliente' AND client_id IS NULL;

ALTER TABLE crm_user ALTER COLUMN role TYPE TEXT USING role::text;
ALTER TABLE case_message ALTER COLUMN sender_role TYPE TEXT USING sender_role::text;

DROP TYPE user_role;
CREATE TYPE user_role AS ENUM (
  'admin',
  'comercial_juridico',
  'junta',
  'perito_interno',
  'perito',
  'cliente'
);

ALTER TABLE crm_user ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE crm_user ALTER COLUMN role SET DEFAULT 'comercial_juridico';
ALTER TABLE case_message ALTER COLUMN sender_role TYPE user_role USING sender_role::user_role;

ALTER TABLE case_message ADD CONSTRAINT case_message_audience_role_check CHECK (
  sender_role = 'comercial_juridico'
  OR (sender_role IN ('perito', 'perito_interno') AND audience = 'juridico_perito')
  OR (sender_role = 'cliente' AND audience = 'juridico_cliente')
);

COMMIT;
