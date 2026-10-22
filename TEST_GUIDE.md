# Test Guide

Prereqs: app reachable at http://localhost:3000 (`npm run dev`) **or** the Compose host port (`docker compose up` — see [Docker (live)](#docker-live) below). `.env.local` filled, migrations applied on cloud Supabase.

```bash
npm test
npm run test:python
```

Sender:

```bash
npm run send-webhook
npm run send-webhook -- ORD-10482
npm run send-webhook -- --unique-email
npm run send-webhook -- --email johndoe+demo@gmail.com
```

No args → random `ORD-xxxxx-xxxx`, customer **Maria Santos**. Extra non-flag arg is a **positional** order id. Do not pass `--order-id`; that string becomes the order id.

---

## Automated test files

| File | Purpose |
|---|---|
| `__tests__/schema.test.ts` | Contact create/update/list Zod schemas |
| `__tests__/contactsService.test.ts` | Contact list/get/create/update service (HubSpot mocked) |
| `__tests__/webhook.test.ts` | HMAC verify + order payload schema (valid/invalid) |
| `__tests__/webhookRoute.test.ts` | `POST /api/webhooks/order` HTTP: 401/400/500/200 |
| `__tests__/orderSyncService.test.ts` | First sync, success duplicate, failed/processing resume, Deal recover-by-name, persist throw, Retry |
| `__tests__/retry.test.ts` | `withRetry`: 429, no 4xx retry, 5xx exhaust, 60s Retry-After cap |
| `__tests__/retryRoute.test.ts` | `POST /api/syncs/[orderId]/retry` HTTP: 200/404/409 |
| `scripts/test_export_deals.py` | Python exporter: order_id parse, currency map, pagination, empty CSV |

---

## Docker (live)

Compose runs the **Next.js app only** (see [`README.md` Docker section](README.md#docker-app-only)). It does **not** start Supabase, HubSpot, or n8n. Use the same cloud credentials in `.env.local`.

Unit tests (`npm test`, `npm run test:python`) still run **on the host**, not inside the image.

### Port

Read `ports` in [`docker-compose.yml`](docker-compose.yml). The mapping is `HOST:CONTAINER`.

- Current file: `4000:4000` and the image `PORT=4000` → open **http://localhost:4000**
- If you change it back to `3000:3000`, use **http://localhost:3000** instead

`npm run dev` uses 3000. Compose on **4000** can run at the same time. If both bind **3000**, stop the dev server first (port already in use).

### Start

Docker Desktop must be running (`docker` cannot talk to the engine otherwise).

```powershell
# Build args NEXT_PUBLIC_* come from a root .env — copy once if needed:
copy .env.local .env

docker compose build
docker compose up
```

PowerShell does not accept `&&`. Use two commands, or `docker compose build; docker compose up`.

Pass:

- Build finishes (`Image … Built`). First `npm ci` needs `--legacy-peer-deps` in the Dockerfile (already set).
- Logs show the Next server listening.
- http://localhost:4000/contacts and `/syncs` load (use your Compose host port).

Env at **runtime** comes from `env_file: .env.local`. After you edit tokens, recreate the container so it reloads:

```powershell
docker compose up --force-recreate
```

Do not commit `.env` / `.env.local`.

### Happy path against the container

From the **host** (not inside the container). Point the sender at Compose, not `npm run dev`:

```powershell
$env:WEBHOOK_URL="http://localhost:4000/api/webhooks/order"
npm run send-webhook -- ORD-DOCKER-1
```

Pass: HTTP 200, `alreadySeen: false`, `status: success`. http://localhost:4000/syncs shows `ORD-DOCKER-1`. HubSpot Contact + Deal `Order ORD-DOCKER-1`.

Same id again:

```powershell
$env:WEBHOOK_URL="http://localhost:4000/api/webhooks/order"
npm run send-webhook -- ORD-DOCKER-1
```

Pass: HTTP 200, `alreadySeen: true`. Still one Deal.

HMAC 401 against Docker:

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/webhooks/order" `
  -Headers @{ "x-webhook-signature" = "this-is-not-a-valid-signature" } `
  -ContentType "application/json" `
  -Body '{"event":"order.created","order_id":"ORD-DOCKER-401"}'
```

Pass: **401**. No new `/syncs` row.

Failed sync + Retry: same steps as [Sad path §3](#3-create-a-failed-sync-then-retry), but after changing `HUBSPOT_PRIVATE_APP_TOKEN` run `docker compose up --force-recreate` (not `npm run dev`). Send with `WEBHOOK_URL` on port **4000**. Restore the token and recreate again before Retry.

### Common failures

| Symptom | Fix |
|---|---|
| `dockerDesktopLinuxEngine` / daemon not running | Start Docker Desktop, wait until it is idle, retry |
| Port already in use | Stop `npm run dev` if Compose also uses 3000; or keep Compose on 4000 |
| `npm ci` ERESOLVE in the image | Dockerfile must use `npm ci --legacy-peer-deps` |
| Pages load, webhook 401 | Sender `WEBHOOK_SIGNING_SECRET` must match the container `.env.local` |
| UI empty / wrong API host | Rebuild after changing `NEXT_PUBLIC_*` (`copy .env.local .env` then `docker compose build`) |

---

## Happy path (live)

### 1. New order

```bash
npm run send-webhook
```

Or pin the id:

```bash
npm run send-webhook -- ORD-HAPPY-1
```

Pass: HTTP 200, `alreadySeen: false`, `status: success`, Contact + Deal IDs present. Note the printed `order_id` if you used the no-arg command.

Check:

- `/syncs` — one row, status success
- HubSpot Contact `maria.santos@example.com`
- HubSpot Deal `Order <order_id>` associated to that Contact
- Deal URL: `https://app.hubspot.com/contacts/<portalId>/record/0-3/<dealId>`

### 2. Same order again (idempotent)

Reuse the id from step 1 (`ORD-HAPPY-1` or the random one the sender printed):

```bash
npm run send-webhook -- ORD-HAPPY-1
```

Pass: HTTP 200, `alreadySeen: true`. Still one Deal.

### 3. Optional: new Contact (unique email)

Default sender always uses Maria. To create a **different** HubSpot Contact:

```bash
npm run send-webhook -- --unique-email
```

Or pin a plus-alias address:

```bash
npm run send-webhook -- --email johndoe+demo@gmail.com
```

Pass: HTTP 200, printed `email` is not Maria. HubSpot has a new Contact (`qa+…@example.com` or John Doe) with Deal associated to **that** Contact, not Maria.

Do not combine `--unique-email` and `--email`.

### 4. Python export

```bash
cd scripts
python -m pip install -r requirements.txt
python export_deals.py --dry-run
```

Pass: JSON includes recent order ids. `currency` filled if HubSpot returns `deal_currency_code`.

### 5. CSV write (optional)

```bash
python export_deals.py
```

Pass: `deals_export.csv` written with header + rows.

---

## Sad path (live)

### 1. Invalid HMAC

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/webhooks/order" `
  -Headers @{ "x-webhook-signature" = "this-is-not-a-valid-signature" } `
  -ContentType "application/json" `
  -Body '{"event":"order.created","order_id":"ORD-FAKE-401"}'
```

Pass: **401 Unauthorized**. PowerShell throws on 401 — that is success. No new `/syncs` row, no HubSpot call.

### 2. Bad payload (valid signature)

```bash
npm run send-webhook
```

Then POST a signed body with `total: -1` or `event: "order.updated"`. Easier: automated in `webhookRoute.test.ts`.

Pass: HTTP **400**. No HubSpot write.

### 3. Create a failed sync (then Retry)

Invalid HMAC / bad payload do **not** create a `/syncs` row. A row is `failed` only after a **valid signed** webhook is accepted and HubSpot (or persist) throws.

1. In `.env.local`, temporarily set a bad token (keep the real one somewhere safe):

   ```bash
   HUBSPOT_PRIVATE_APP_TOKEN=pat-invalid-for-failed-sync
   ```

2. Restart `npm run dev` so Next.js reloads env.

3. Send a **new** order id:

   ```bash
   npm run send-webhook -- ORD-FAIL-1
   ```

   Pass: HTTP **200**, `alreadySeen: false`, `status: failed`. `/syncs` shows the row with an error and **Retry**.

4. Restore the real `HUBSPOT_PRIVATE_APP_TOKEN` in `.env.local`, restart `npm run dev`.

5. On `/syncs`, click **Retry** (or redeliver: `npm run send-webhook -- ORD-FAIL-1`).

   Pass: status becomes `success` or stays `failed` with an error message. HubSpot IDs update if recovered.

Retry is also enabled for stuck `processing`.

Do not leave the invalid token in `.env.local` after the test. Do not commit `.env.local`.

### 4. Retry on success (must 409)

Do not click Retry on a success row (button hidden). API check:

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/syncs/ORD-HAPPY-1/retry"
```

Pass: **409** if that order is `success`.

### 5. Resume failed redelivery

If you have a `failed` `order_id`:

```bash
npm run send-webhook -- <that-failed-order-id>
```

Pass: sync re-runs (`alreadySeen: false`). Still one Deal with name `Order <order_id>`.


