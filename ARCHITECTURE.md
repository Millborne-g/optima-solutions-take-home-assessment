# Architecture

## Overview

Next.js 16 App Router + lightweight Feature-Sliced Design, with a dedicated `server/` layer for privileged HubSpot and Supabase access.

## Layers

```
app → views → widgets → features → entities → shared
         ↑
   server/ (Route Handlers + Server Components only)
```

| Layer | Responsibility |
|---|---|
| `app/` | Routes, layouts, API handlers |
| `views/` | Page composition |
| `widgets/` | ContactsTable, SyncTable |
| `features/` | create/edit contact, retry sync |
| `entities/` | Contact + Order types and Zod schemas |
| `shared/` | UI primitives, `apiResponse` |
| `server/` | HubSpot clients, Supabase repos, webhook HMAC, retry, sync services |

## Order sync flow

1. `POST /api/webhooks/order` reads raw body, verifies `x-webhook-signature` (HMAC-SHA256).
2. Zod validates the `order.created` payload.
3. `insertOrIgnore(order_id)` — unique constraint provides durable idempotency.
4. Mark `processing`, upsert Contact, create Deal + association, persist IDs.
5. Transient HubSpot errors go through `withRetry` (429 / 5xx).
6. Failures land in `order_syncs` for `/syncs` Retry.

## Database

- `contacts` — HubSpot contact cache (migration 001)
- `order_syncs` — sync attempts (migration 002), unique `order_id`, RLS on, service-role only

## Deviations from classic FSD

- `server/` is non-standard FSD but is the safe place for secrets in Next.js.
- App Router `app/` replaces a separate FSD `pages/` folder for routing.
