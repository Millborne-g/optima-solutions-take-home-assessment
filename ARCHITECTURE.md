# Architecture

## Overview

This application follows **Next.js 16 App Router** conventions combined with a lightweight **Feature-Sliced Design (FSD)** layer structure. The App Router's file-system routing replaces the traditional FSD `pages/` layer; all other layers are standard FSD.

---

## Layer structure

```
app/           Next.js routing, layouts, API Route Handlers
views/         Page-level composition (assembles widgets and features)
widgets/       Composite, stateful UI sections (ContactsTable with pagination)
features/      User-action hooks and forms (create-contact, edit-contact)
entities/      Domain types (Contact) and Zod validation schemas
shared/        Reusable UI primitives (Button, Input, FormField) and utilities
server/        Server-only: HubSpot client, Supabase client, service layer
```

### Import direction

Higher layers may import lower layers; the reverse is forbidden:

```
app → views → widgets → features → entities → shared
              ↑
         (server/ is imported only by app/api/... Route Handlers
          and Server Components — never by client components)
```

---

## Key modules

### `server/hubspot/`

| File | Responsibility |
|---|---|
| `client.ts` | Singleton `@hubspot/api-client` initialised with `HUBSPOT_PRIVATE_APP_TOKEN`. Protected by `import "server-only"`. |
| `contactsApi.ts` | `listContacts`, `getContactById`, `searchContactByEmail`, `createContact`, `updateContact`. Maps raw HubSpot objects to `Contact` domain type. Translates 429/404/4xx into typed errors (`HubSpotRateLimitError`, `HubSpotNotFoundError`, `HubSpotApiError`). |

### `server/supabase/`

| File | Responsibility |
|---|---|
| `client.ts` | Singleton Supabase client using the service-role key. Protected by `import "server-only"`. RLS is bypassed; all access is via this server-side client. |
| `contactsRepository.ts` | `upsertContact`, `findByHubspotId`. Returns `null` on DB error (partial-failure semantics). |
| `database.types.ts` | Manual TypeScript representation of the `contacts` table schema. |

### `server/services/contactsService.ts`

Orchestrates HubSpot and Supabase:

- **`getContacts(after?, limit?)`** — lists HubSpot contacts and triggers a background Supabase sync.
- **`upsertContactByEmail(input)`** — search-before-create duplicate detection:
  1. `searchContactByEmail` → if found, `updateContact`; if not, `createContact`.
  2. `upsertContact` to sync to Supabase.
  3. Supabase failure is logged but does not throw — the HubSpot result is always returned.
- **`updateContactById(id, input)`** — patches a HubSpot contact and syncs.

### `entities/contact/model/`

| File | Responsibility |
|---|---|
| `types.ts` | `Contact`, `CreateContactInput`, `UpdateContactInput`, `UpsertContactResult`, `ContactsPage` |
| `schema.ts` | Zod v4 schemas: `createContactSchema`, `updateContactSchema`, `listContactsQuerySchema` |

### `app/api/contacts/`

| Route | Methods | Behaviour |
|---|---|---|
| `/api/contacts` | GET, POST | List with pagination; create or update by email |
| `/api/contacts/[id]` | GET, PATCH | Fetch single; partial update |

All Route Handlers: validate inputs with Zod → invoke service → return consistent `{ error, code }` on failure.

---

## Data model

### Supabase `contacts` table

```sql
id           uuid  PRIMARY KEY DEFAULT gen_random_uuid()
hubspot_id   text  NOT NULL UNIQUE          -- stable HubSpot contact ID
email        text  NOT NULL
first_name   text
last_name    text
phone        text
synced_at    timestamptz NOT NULL DEFAULT now()
created_at   timestamptz NOT NULL DEFAULT now()
updated_at   timestamptz NOT NULL DEFAULT now()
```

Row Level Security is enabled. No policies grant anon/authenticated access — all writes use the service-role key which bypasses RLS.

---

## Request data flow

```
Browser (Client Component)
  │
  │  fetch("/api/contacts", { method: "POST", body: { email, firstName, ... } })
  ▼
app/api/contacts/route.ts  (Route Handler — Server)
  │  Zod validate body
  │  Call contactsService.upsertContactByEmail()
  ▼
server/services/contactsService.ts
  │  searchContactByEmail(email)  ──►  HubSpot CRM API
  │  createContact() or updateContact()  ──►  HubSpot CRM API
  │  upsertContact(result)  ──►  Supabase PostgreSQL (best-effort)
  │  Return { contact, wasUpdated }
  ▼
Route Handler → Response.json({ contact, wasUpdated }, { status: 201 | 200 })
  ▼
Browser — update UI state
```

---

## Security model

| Concern | Mitigation |
|---|---|
| HubSpot token exposure | `import "server-only"` in `server/hubspot/client.ts`; env var, never hardcoded |
| Supabase service-role exposure | `import "server-only"` in `server/supabase/client.ts`; not prefixed `NEXT_PUBLIC_` |
| Supabase direct client access | RLS enabled on `contacts` table; no public policies granted |
| Input injection | Zod validation on all Route Handler inputs |
| Rate-limit abuse | 429 responses propagated with `Retry-After` header |
| Secrets in repository | `.env*` excluded by `.gitignore`; `.env.example` contains only placeholder values |

---

## Testing approach

Tests are co-located in `__tests__/` at the repo root and run with **Vitest 5 + jsdom**.

External services (HubSpot SDK, Supabase client) are **fully mocked** with `vi.mock()`. No real API calls are made during tests.

| Test file | Covers |
|---|---|
| `schema.test.ts` | Zod schema validation (13 cases: valid inputs, invalid email, blank fields, coercion) |
| `contactsService.test.ts` | Service logic (14 cases: create path, update path, rate-limit propagation, Supabase partial failure, pagination cursors) |

---

## Known deviations from standard FSD

| Deviation | Reason |
|---|---|
| `server/` layer (non-standard FSD) | FSD has no concept of server-only modules; a dedicated `server/` dir with `server-only` guards is the idiomatic Next.js pattern |
| `app/` doubles as routing and API | App Router mandates this co-location; `pages/` FSD layer is unnecessary |
| Supabase I/O in `server/supabase/` (not `entities/`) | FSD convention puts data access in `entities/`; for this project keeping all privileged server I/O in `server/` is safer and clearer |
