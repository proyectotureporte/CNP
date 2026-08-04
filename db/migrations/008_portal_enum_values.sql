-- Los valores de enum deben confirmarse en una transacción anterior a su uso.
-- Este archivo queda separado porque el runner envía cada migración como una
-- única consulta y PostgreSQL rechaza usar valores recién añadidos sin commit.

ALTER TYPE client_type ADD VALUE IF NOT EXISTS 'persona_natural';
ALTER TYPE client_type ADD VALUE IF NOT EXISTS 'abogado_externo';

ALTER TYPE case_event_type ADD VALUE IF NOT EXISTS 'deliverable_rejected';
ALTER TYPE case_event_type ADD VALUE IF NOT EXISTS 'document_requested';
ALTER TYPE case_event_type ADD VALUE IF NOT EXISTS 'execution_suspended';
ALTER TYPE case_event_type ADD VALUE IF NOT EXISTS 'execution_resumed';
ALTER TYPE case_event_type ADD VALUE IF NOT EXISTS 'message_sent';
ALTER TYPE case_event_type ADD VALUE IF NOT EXISTS 'payment_receipt_uploaded';
ALTER TYPE case_event_type ADD VALUE IF NOT EXISTS 'expert_profile_updated';
