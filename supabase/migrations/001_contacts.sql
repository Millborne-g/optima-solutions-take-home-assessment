-- Migration: 001_contacts
-- Creates the local contacts sync cache table.
--
-- HubSpot is the system of record; this table is a local cache keyed by
-- the stable HubSpot contact ID. All writes come from the server via the
-- service-role key — no direct client access.

CREATE TABLE IF NOT EXISTS contacts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hubspot_id   text        NOT NULL UNIQUE,
  email        text        NOT NULL,
  first_name   text,
  last_name    text,
  phone        text,
  synced_at    timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by email (used for duplicate detection fallback).
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);

-- Row Level Security:
-- All access is via the service-role key which bypasses RLS.
-- No anon/authenticated policies are granted — this prevents direct
-- client-side access to the contacts table.
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
