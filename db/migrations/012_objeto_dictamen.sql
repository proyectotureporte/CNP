ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS dictamen_object TEXT;

COMMENT ON COLUMN cases.dictamen_object IS
  'Objeto técnico-jurídico del dictamen, separado de la necesidad comercial del cliente.';
