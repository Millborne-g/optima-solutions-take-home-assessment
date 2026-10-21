# HubSpot CRM Contacts Dashboard

A production-minded full-stack application that integrates HubSpot CRM with a Next.js 16 frontend and Supabase PostgreSQL sync cache.

---

## Application purpose

This application provides a contacts dashboard for HubSpot CRM. It allows you to:

- **List** HubSpot contacts with cursor-based pagination.
- **Create** new contacts with server-side validation and automatic duplicate detection.
- **Update** existing contacts by HubSpot ID.
- **Sync** contacts to a local Supabase PostgreSQL cache after every HubSpot write.

HubSpot is the **source of truth**. Supabase stores a local cache keyed by stable HubSpot contact IDs.

---

## Architecture

The application uses **Next.js 16 App Router** with a lightweight **Feature-Sliced Design (FSD)** adapted for the App Router's colocation model.

```
app/           → Route entry points (pages + API Route Handlers)
views/         → Page-level component composition
widgets/       → Composite UI sections (ContactsTable)
features/      → User action hooks and forms (create-contact, edit-contact)
entities/      → Domain types (Contact) and Zod validation schemas
shared/        → Reusable UI primitives (Button, Input) and utilities
server/        → Server-only: HubSpot client, Supabase client, service layer
```

**Import direction:** `app → views → widgets → features → entities → shared`  
**Server constraint:** Everything under `server/` is protected by `import "server-only"` and must never be imported by client components.

### Request flow

```
Browser → fetch /api/contacts
       → Route Handler (Zod validate)
       → contactsService (orchestrate)
       → HubSpot API (source of truth)
       → Supabase (best-effort sync cache)
       → JSON response → Client Component re-render
```

For a full architecture description including layer responsibilities, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Prerequisites

- Node.js ≥ 20.9 (tested on 24.14)
- npm ≥ 11
- A [HubSpot developer account](https://developers.hubspot.com) with a test CRM portal
- A [Supabase](https://supabase.com) project (free tier is sufficient)

---

## HubSpot authentication and scopes

This application uses **Private App Access Tokens** — the simplest, most reliable authentication method for server-side integrations.

### Create a Private App

1. Log in to your HubSpot portal.
2. Go to **Settings → Integrations → Private Apps**.
3. Click **Create a private app**.
4. Under **Scopes**, add:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
5. Click **Create app** and copy the access token (shown once).

---

## Supabase setup and schema

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (server-only)
3. Run the migration in the **SQL Editor**:

```sql
-- Paste the contents of supabase/migrations/001_contacts.sql
```

Or use the Supabase CLI:

```bash
supabase db push
```

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in your real values:

```bash
cp .env.example .env.local
```

| Variable | Purpose | Exposure |
|---|---|---|
| `HUBSPOT_PRIVATE_APP_TOKEN` | HubSpot Private App access token | Server-only |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Safe for client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (RLS-limited) | Safe for client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (bypasses RLS) | **Server-only** |

> **Security note:** `HUBSPOT_PRIVATE_APP_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` are imported only inside `server/` and protected with `import "server-only"`. They are never exposed to the browser.

---

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your HubSpot and Supabase credentials

# 3. Run the Supabase migration (see above)

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/contacts`.

---

## Available scripts

| Script | Command | Purpose |
|---|---|---|
| Dev server | `npm run dev` | Start Next.js development server |
| Production build | `npm run build` | Build for production (Turbopack) |
| Start production | `npm run start` | Start production server |
| Lint | `npm run lint` | ESLint 9 flat config |
| Type check | `npm run type-check` | `tsc --noEmit` |
| Tests | `npm test` | Vitest unit tests |
| Test watch | `npm run test:watch` | Vitest in watch mode |
| Test coverage | `npm run test:coverage` | Vitest with V8 coverage |

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/contacts` | List contacts (`?after=<cursor>&limit=<n>`) |
| `POST` | `/api/contacts` | Create or update contact by email |
| `PATCH` | `/api/contacts/:id` | Partially update a contact by HubSpot ID |
| `GET` | `/api/contacts/:id` | Fetch a single contact by HubSpot ID |

All endpoints return `{ error: string, code: string }` on failure.

### POST /api/contacts — duplicate handling

Rather than returning a 409 error, the endpoint automatically detects an existing contact by email and updates it instead:

- **200 + `wasUpdated: true`** — email already existed; contact was updated.
- **201 + `wasUpdated: false`** — new contact created.

---

## Implemented functionality

- [x] HubSpot Private App authentication (server-only)
- [x] Contacts list with cursor-based pagination
- [x] Contact creation with duplicate detection (search-before-create)
- [x] Contact update (partial PATCH)
- [x] Zod server-side validation on all inputs
- [x] Supabase sync cache (upsert on every HubSpot write)
- [x] Partial failure handling (HubSpot ok, Supabase fails → log and continue)
- [x] Rate-limit handling (429 → `HubSpotRateLimitError` with `retryAfterMs`)
- [x] Consistent error responses with typed codes
- [x] Loading, empty, and error states in UI
- [x] 27 Vitest unit tests (schema validation, service logic, mocked externals)

---

## Known limitations

- **Webhooks not implemented.** Inbound HubSpot webhooks would require a publicly accessible URL and HMAC verification; deferred given the time budget.
- **No user authentication.** The dashboard is unauthenticated. In production, add Next.js middleware with session checks.
- **Supabase sync is one-way (HubSpot → Supabase).** Changes made directly in HubSpot between requests are not automatically reflected; refresh to re-sync.
- **Pagination is cursor-based (append-only).** No previous-page navigation.
- **No search UI.** Search-by-email logic exists in the service layer for duplicate detection but is not exposed as a UI feature.

---

## Important design decisions

| Decision | Rationale |
|---|---|
| Private App token (not OAuth) | Simplest approach for a server-side assessment; no browser OAuth flow needed |
| HubSpot as source of truth | Avoids conflict resolution complexity; Supabase is a cache only |
| Best-effort Supabase sync | Prevents Supabase failures from breaking the HubSpot integration path |
| Zod v4 server-side validation only | Client forms submit to Route Handlers for authoritative validation; client uses basic HTML5 attributes only |
| `server-only` import guard | Build-time prevention of accidental credential exposure to the browser |
| Upsert-on-email instead of 409 | More user-friendly; avoids the UI having to handle and retry conflict errors |
