# Test Guide

Prereqs: `npm run dev` running, `.env.local` filled, migrations applied.

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

### 3. Failed sync + Retry

If a row is `failed` on `/syncs`:

1. Click **Retry**
2. Pass: status becomes `success` or stays `failed` with an error message. HubSpot IDs update if recovered.

Retry is also enabled for stuck `processing`.

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


