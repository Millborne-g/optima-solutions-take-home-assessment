-- Migration: 002_order_syncs
-- Durable order → HubSpot sync attempts with unique order_id for idempotency.
--
-- All writes come from the server via the service-role key — no direct client access.

CREATE TABLE IF NOT EXISTS order_syncs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              text        NOT NULL UNIQUE,
  status                text        NOT NULL DEFAULT 'pending',
  -- status values: pending | processing | success | failed
  raw_payload           jsonb       NOT NULL,
  hubspot_contact_id    text,
  hubspot_deal_id       text,
  error_message         text,
  attempt_count         int         NOT NULL DEFAULT 0,
  last_attempted_at     timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_syncs_status ON order_syncs (status);
CREATE INDEX IF NOT EXISTS idx_order_syncs_created_at ON order_syncs (created_at DESC);

ALTER TABLE order_syncs ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies — service-role bypasses RLS
