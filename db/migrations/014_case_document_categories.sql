-- Categorías documentales definitivas del expediente pericial.
-- Los valores nuevos se confirman en esta migración antes de usarlos en la 015.

ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'solicitud_dictamen';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'ficha_tecnica';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'nda';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'solicitud_documentos';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'propuesta_comercial';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'documentos_caso';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'informe_preliminar';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'dictamen';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'comprobantes_pago';
