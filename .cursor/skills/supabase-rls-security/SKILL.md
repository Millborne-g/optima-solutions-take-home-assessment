---
name: supabase-rls-security
description: >-
  Reviews, designs, and verifies Supabase RLS and document ownership/sharing
  policies. Use when changing migrations, policies, document access, sharing,
  profiles lookup, or when diagnosing authorization or infinite-recursion
  policy errors.
---

# Supabase RLS Security

## Workflow

1. **Inspect** `supabase/migrations/001_initial_schema.sql`, auth usage in `shared/api/supabase.ts` and `app/providers.tsx`, and entity APIs under `entities/document` and `entities/user`.
2. **Map** ownership (`documents.owner_id`), shares (`document_shares`), and permission values (`view` | `edit`).
3. **State intended rules** for SELECT, INSERT, UPDATE, DELETE on each table.
4. **Review** policies for escalation (self-grant, ownership change, share tampering) and for private-doc leakage.
5. **Check recursion**: policies that cross `documents` ↔ `document_shares` must use `SECURITY DEFINER` helpers (`is_document_owner`, `has_document_share`), not raw recursive subqueries.
6. **Propose the smallest safe change** consistent with the existing schema — do not invent tables/columns.
7. **Explain** security-sensitive changes and wait for approval before applying destructive SQL.
8. **Verify** with available tests, SQL checks, or written two-user manual steps. Mark anything untested as **Not Verified**.
9. **Never** disable RLS to unblock a client error.
10. **Never** expose service-role keys in the frontend or repository.

## Report

Summarize: files reviewed, intended vs actual permissions, proposed/applied changes, verification evidence, remaining risks.
