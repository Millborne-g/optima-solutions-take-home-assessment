---
name: fsd-feature-implementation
description: >-
  Implements or modifies Docsync features within Feature-Sliced Design. Use when
  adding pages, widgets, features, entities, shared utilities, or when unsure
  which FSD layer should own a change.
---

# FSD Feature Implementation

## Workflow

1. **Inspect** `ARCHITECTURE.md`, `.cursor/rules/project-architecture.mdc`, and the nearest existing slice for patterns.
2. **Identify layers** for each responsibility (`app` / `pages` / `widgets` / `features` / `entities` / `shared`).
3. **Analyze** the request; for substantial work, produce a short plan before coding.
4. **Implement** following import direction: `app → pages → widgets → features → entities → shared`.
5. **Reuse** entity APIs, shared UI (`Button`, `Dialog`, …), and lib helpers; avoid duplicate logic.
6. **Avoid** circular imports, cross-feature imports, and unnecessary abstractions.
7. **Stay scoped** to the requested task — no drive-by refactors.
8. **Verify** affected flows with `npm test` / `npm run lint` / `npm run build` as appropriate.
9. **Report** changed files, layer decisions, verification results, and remaining issues.

## Placement cheat sheet

| Need | Layer |
|---|---|
| Route screen | `pages/` |
| Composite chrome | `widgets/` |
| User action + hook | `features/<name>/` |
| Domain type / API / card | `entities/` |
| Primitive UI / util / client | `shared/` |
| Provider / router / theme | `app/` |
