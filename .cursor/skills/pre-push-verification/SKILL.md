---
name: pre-push-verification
description: >-
  Runs a Rules & Skills compliance audit, then tests, lint, production build,
  TypeScript checks, and git review before any Git push. Writes findings to
  documentation/ai-reviews/pre-push-compliance-report.md. Use before pushing,
  when verifying push readiness, or preparing a PR. Does not authorize a push
  by itself.
---

# Pre-Push Verification

## Workflow

Before any Git push, complete **A → B → C → D** in order. Do not skip the compliance audit.

### A. Inspect the project

1. Read `package.json`, the lockfile, and project instructions (`AI_WORKFLOW.md`, `AGENTS.md` if present).
2. List all files under `.cursor/rules/` and `.cursor/skills/*/SKILL.md`.
3. Identify scripts. In this repo:
   - Tests: `npm test`
   - Lint: `npm run lint`
   - Production build: `npm run build` (`tsc -b && vite build`)
   - Type check: report `tsc -b` from build, or `npx tsc -b --pretty false` if a separate run is needed (do not add scripts without authorization)
4. Inspect `git status`, `git branch`, and the current commit when available.
5. Determine the scope of changes to audit (working tree + staged diff, or the branch vs base when reviewing a PR).

### B. Rules & Skills Compliance Audit (mandatory)

Discover and evaluate **all applicable** project rules and skills against repository evidence. Do not invent requirements, files, features, or violations.

#### B.1 Discover and checklist

1. Read every `.mdc` in `.cursor/rules/` and every `SKILL.md` in `.cursor/skills/` (except skip re-executing this skill recursively as a nested push).
2. Extract actionable requirements into a checklist (architecture, React/TS, Tailwind/theme, Supabase/RLS, testing, assignment scope, other discovered conventions).
3. Note which requirements apply to the current change scope vs the broader codebase.

Current known instructions in this repo (re-discover each run; do not treat this list as exhaustive forever):

| Kind | Name |
|---|---|
| Rule | `project-architecture` |
| Rule | `react-typescript` |
| Rule | `tailwind-design-system` |
| Rule | `supabase-security` |
| Rule | `testing-verification` |
| Rule | `assignment-scope` |
| Skill | `supabase-rls-security` |
| Skill | `tailwind-theme-and-dark-mode` |
| Skill | `fsd-feature-implementation` |
| Skill | `assignment-completion-audit` |
| Skill | `pre-push-verification` (this skill) |

#### B.2 Inspect evidence

Where applicable, check:

- Feature-Sliced Design layering and import direction (`app → pages → widgets → features → entities → shared`)
- React/TypeScript conventions (no unjustified `any`, no `React.FC`, no `enum` under `erasableSyntaxOnly`)
- Tailwind design-system / theme tokens and dark mode
- Supabase auth, ownership, sharing, RLS (never disable RLS; no secrets in client)
- Testing quality for critical behavior
- Assignment deliverables and scope guardrails
- Git diff: unintended changes, generated artifacts, exposed secrets (`.env`, service-role keys)

Do **not** mark a requirement violated merely because the implementation differs from a personal preference. Follow the repository’s actual instructions and cite evidence.

#### B.3 Classify findings

For each gap:

- Distinguish **Confirmed** violations, **Potential** risks, and **Unverified** items (could not be checked).
- Assign severity: **Critical**, **High**, **Medium**, or **Low**.
- Prefer evidence: file paths, line numbers, rule/skill requirement text, and short quotes or diffs.

#### B.4 Write / update the compliance report

Path (create parent dirs if needed):

`documentation/ai-reviews/pre-push-compliance-report.md`

If the repo later establishes a different compliance-report convention, inspect and follow that instead. Each audit run **overwrites/updates** this file with the latest results — never leave a stale report presented as current.

Report structure:

1. **Header** — audit date/time (if available), git branch, commit SHA (if available), inspected scope
2. **Rules and Skills inspected** — list discovered instruction files
3. **Overall result** — exactly one of: `PASS` | `FAIL` | `PARTIAL`
4. **Summary of gaps** — counts by severity; if none in scope, state explicitly that no gaps were found **in the inspected scope** (do not claim whole-codebase compliance without sufficient inspection)
5. **Detailed findings** — each with:
   - Unique finding ID (e.g. `F-001`)
   - Severity
   - Category
   - Relevant rule or skill + specific requirement
   - Affected file and line numbers (when available)
   - Evidence
   - Why it matters
   - Recommended correction
   - Verification needed to confirm resolution
   - Status: `Confirmed` | `Potential` | `Unverified` | `Resolved`
6. **Verification commands** — tests, lint, build, typecheck (filled in after section C)
7. **Checks that could not be completed** and why
8. **Remaining risks and next steps**

If the report appears in the Git diff, review it for accuracy and ensure it exposes no secrets.

### C. Required verification commands

Run using this project’s package manager (`npm`). Prefer separate runs where practical:

| Check | Command |
|---|---|
| Tests | `npm test` |
| Lint | `npm run lint` |
| Production build | `npm run build` |
| TypeScript | Explicitly report `tsc -b` success from `build`, or run `npx tsc -b --pretty false` |

Record each command, result, and failure details in the Markdown report.

Also re-inspect:

- `git status` and `git diff`
- Unintended modifications and generated files
- Accidentally staged or committed secrets
- Whether the compliance report matches the current code and check results

### D. Handling findings (audit ≠ auto-fix)

- Do **not** automatically rewrite the codebase to fix every finding.
- Report gaps and recommend minimal, targeted fixes.
- Fix issues **only** when the user explicitly authorizes fixes and they are in scope.
- After authorized fixes: rerun affected audit checks and verification commands; update the report (Resolved vs remaining). Never mark Resolved without evidence.
- Do not weaken tests, disable lint rules, bypass checks, or change config merely to pass.

**Push blocking policy:**

- Unresolved **Critical** or **High** findings → **block push by default**
- **Medium** / **Low** → report clearly; do not silently ignore; follow existing push policy and require explicit user acknowledgment before pushing with known Medium/Low issues if they ask to proceed
- Failed or unverified required checks → not ready to push

## Failure handling

- Stop and report before pushing if any required check fails or Critical/High findings remain unresolved.
- Fix only authorized issues, then rerun affected checks.
- Do not claim a check passed without a successful run.
- If a check cannot run, mark it **Not Verified** / **Unverified** and explain why — never skip silently.
- Do not install packages or change project configuration without authorization.

## Git safety

- Completing this skill does **not** authorize commit, push, or deploy.
- Never commit or push automatically.
- Never push after a failed or unverified required check unless the user **explicitly** authorizes proceeding despite the reported issue.
- Do not discard or overwrite the user’s unrelated changes.
- Do not use destructive Git commands.
- Do not modify application source files merely to produce the audit report unless fixes are separately authorized.

## Final output (to the user)

Summarize:

1. Compliance audit result (`PASS` / `FAIL` / `PARTIAL`)
2. Number of findings by severity
3. Test, lint, build, and type-check outcomes
4. Report path: `documentation/ai-reviews/pre-push-compliance-report.md`
5. One overall outcome:
   - **Ready to push:** compliance PASS (or PARTIAL with only accepted Medium/Low and explicit user acknowledgment), all four checks passed, git review clean of secrets/unintended files
   - **Blocked:** Critical/High unresolved, or a required check failed
   - **Not fully verified:** one or more required checks or audit items could not be completed
