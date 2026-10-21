import "server-only";
import {
  HubSpotRateLimitError,
  HubSpotApiError,
} from "@/server/hubspot/contactsApi";

export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(err: unknown): boolean {
  if (err instanceof HubSpotRateLimitError) return true;
  if (err instanceof HubSpotApiError) {
    const code = err.statusCode;
    return code === 429 || code === 500 || code === 502 || code === 503 || code === 504;
  }
  return false;
}

/** Cap Retry-After so a single webhook request cannot block indefinitely. */
const MAX_RETRY_AFTER_MS = 60_000;

function delayForError(err: unknown, attempt: number, baseDelayMs: number): number {
  if (err instanceof HubSpotRateLimitError) {
    return Math.min(err.retryAfterMs, MAX_RETRY_AFTER_MS);
  }
  // Exponential backoff: base * 2^(attempt-1)
  return baseDelayMs * 2 ** (attempt - 1);
}

/**
 * Retry a function on transient HubSpot errors (429 / 5xx).
 * Permanent 4xx errors are not retried.
 *
 * Default: 4 attempts, base delay 500ms (≈ 0 + 500 + 1000 + 2000 ms).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 4;
  const baseDelayMs = opts.baseDelayMs ?? 500;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (!isRetryable(err) || attempt === maxAttempts) {
        throw err;
      }

      const delayMs = delayForError(err, attempt, baseDelayMs);
      await sleep(delayMs);
    }
  }

  throw lastError;
}
