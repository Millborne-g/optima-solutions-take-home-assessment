import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * HMAC-SHA256 webhook signature verification.
 *
 * Assumption (not specified in the assessment brief):
 * - Header: x-webhook-signature
 * - Algorithm: HMAC-SHA256 over the exact raw UTF-8 body
 * - Encoding: lowercase hex
 */

export const WEBHOOK_SIGNATURE_HEADER = "x-webhook-signature";

/**
 * Compute the expected HMAC-SHA256 hex digest for a raw body.
 */
export function computeWebhookSignature(
  rawBody: string,
  secret: string,
): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

/**
 * Verify a webhook signature using constant-time comparison.
 *
 * @returns true when the signature is valid
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) return false;

  const expected = computeWebhookSignature(rawBody, secret);
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Read the webhook signing secret from the environment.
 * Throws if missing — callers should catch and return 500 / fail closed.
 */
export function getWebhookSigningSecret(): string {
  const secret = process.env.WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    throw new Error(
      "WEBHOOK_SIGNING_SECRET is not set. " +
        "Generate a secret (e.g. openssl rand -hex 32) and add it to .env.local.",
    );
  }
  return secret;
}
