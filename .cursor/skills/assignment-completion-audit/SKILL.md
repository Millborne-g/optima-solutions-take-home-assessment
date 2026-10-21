---
name: assignment-completion-audit
description: >-
  Audits Docsync against the Ajaia assignment requirements and submission
  deliverables. Use when checking completeness, preparing submission, reviewing
  gaps, or producing a status report. Does not implement fixes unless asked.
---

# Assignment Completion Audit

## Mode

**Audit only** unless the user explicitly asks to fix issues.

## Workflow

1. Inspect implementation under `src/` and docs at the repo root.
2. Verify document CRUD + persistence (Supabase).
3. Verify rich text (bold, italic, underline, headings, lists) via toolbar/editor.
4. Verify import for supported formats (`.md`, `.txt`).
5. Verify ownership and sharing flows in code; note whether two-user live tests were done.
6. Review RLS in `supabase/migrations/001_initial_schema.sql` (policy presence ≠ proven secure).
7. Review Tailwind theme + light/dark (tokens, ThemeProvider, ThemeToggle).
8. Run available checks: `npm test`, `npm run lint`, `npm run build` — report actual results.
9. Review `README.md`, `ARCHITECTURE.md`, `AI_WORKFLOW.md`, `SUBMISSION.md`.
10. Check `LIVE_URL.txt` and `WALKTHROUGH_URL.txt` for real URLs vs placeholders.
11. Classify each requirement: `Complete` | `Partial` | `Missing` | `Failed` | `Not Verified`.
12. Cite evidence (paths, commands, outputs, or manual steps).
13. List blockers and remaining work in priority order.

## Output

A structured checklist with classifications, evidence, and prioritized remaining work. Do not invent pass results.
