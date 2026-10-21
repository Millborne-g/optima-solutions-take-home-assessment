/**
 * Mock order.created webhook sender.
 *
 * Usage:
 *   npm run send-webhook
 *   npm run send-webhook -- ORD-99999
 *   npm run send-webhook -- --unique-email
 *   npm run send-webhook -- --unique-email ORD-99999
 *   npm run send-webhook -- --email johndoe+demo@gmail.com
 *
 * Positional arg = order id (do not pass --order-id).
 * Default customer is Maria Santos. Use --unique-email or --email for a new Contact.
 *
 * Reads WEBHOOK_SIGNING_SECRET and optional WEBHOOK_URL from .env.local.
 */

import { createHmac, randomBytes } from "crypto";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal(): void {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function printUsage(): void {
  console.error(`Usage:
  npm run send-webhook
  npm run send-webhook -- ORD-99999
  npm run send-webhook -- --unique-email
  npm run send-webhook -- --unique-email ORD-99999
  npm run send-webhook -- --email johndoe+demo@gmail.com

Do not pass --order-id. Do not combine --unique-email and --email.`);
}

type ParsedArgs = {
  orderId: string | undefined;
  uniqueEmail: boolean;
  email: string | undefined;
};

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseArgs(argv: string[]): ParsedArgs {
  let orderId: string | undefined;
  let uniqueEmail = false;
  let email: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--unique-email") {
      uniqueEmail = true;
      continue;
    }

    if (arg === "--email") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        console.error("--email requires an address");
        printUsage();
        process.exit(1);
      }
      if (!looksLikeEmail(next)) {
        console.error(`Invalid email: ${next}`);
        process.exit(1);
      }
      email = next;
      i += 1;
      continue;
    }

    if (arg.startsWith("--")) {
      console.error(`Unknown flag: ${arg}`);
      printUsage();
      process.exit(1);
    }

    if (orderId !== undefined) {
      console.error(`Unexpected extra argument: ${arg}`);
      printUsage();
      process.exit(1);
    }
    orderId = arg;
  }

  if (uniqueEmail && email) {
    console.error("Pass either --unique-email or --email, not both");
    printUsage();
    process.exit(1);
  }

  return { orderId, uniqueEmail, email };
}

loadEnvLocal();

const secret = process.env.WEBHOOK_SIGNING_SECRET;
if (!secret) {
  console.error("WEBHOOK_SIGNING_SECRET is not set in .env.local");
  process.exit(1);
}

const url =
  process.env.WEBHOOK_URL ?? "http://localhost:3000/api/webhooks/order";

const { orderId: orderIdArg, uniqueEmail, email: emailFlag } = parseArgs(
  process.argv.slice(2),
);

const orderId =
  orderIdArg ??
  `ORD-${String(Date.now()).slice(-5)}-${randomBytes(2).toString("hex")}`;

type Customer = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
};

function resolveCustomer(): Customer {
  if (emailFlag) {
    return {
      email: emailFlag,
      first_name: "John",
      last_name: "Doe",
      phone: "+639171234567",
    };
  }
  if (uniqueEmail) {
    return {
      email: `qa+${Date.now()}@example.com`,
      first_name: "Qa",
      last_name: "Tester",
      phone: "+639171234567",
    };
  }
  return {
    email: "maria.santos@example.com",
    first_name: "Maria",
    last_name: "Santos",
    phone: "+639171234567",
  };
}

const customer = resolveCustomer();

const payload = {
  event: "order.created",
  order_id: orderId,
  created_at: new Date().toISOString().replace("Z", "+00:00"),
  customer,
  items: [
    {
      sku: "TSH-BLK-M",
      name: "Black Tee (M)",
      qty: 2,
      price: 450.0,
    },
  ],
  currency: "PHP",
  total: 900.0,
};

const body = JSON.stringify(payload);
const signature = createHmac("sha256", secret)
  .update(body, "utf8")
  .digest("hex");

async function main() {
  console.log(`POST ${url}`);
  console.log(`order_id: ${orderId}`);
  console.log(`email: ${customer.email}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature,
    },
    body,
  });

  const text = await res.text();
  console.log(`Status: ${res.status}`);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }

  if (!res.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
