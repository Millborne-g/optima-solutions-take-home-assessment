import { describe, it, expect, vi, beforeEach } from "vitest";
import { HubSpotRateLimitError, HubSpotApiError } from "@/server/hubspot/contactsApi";

vi.mock("@/server/hubspot/contactsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/hubspot/contactsApi")>();
  return actual;
});

import { withRetry } from "@/server/lib/retry";

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledOnce();
  });

  it("retries on 429 then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new HubSpotRateLimitError(10))
      .mockResolvedValueOnce("ok");

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry permanent 4xx", async () => {
    const fn = vi.fn().mockRejectedValue(new HubSpotApiError("bad", 400));
    await expect(withRetry(fn, { maxAttempts: 4 })).rejects.toThrow("bad");
    expect(fn).toHaveBeenCalledOnce();
  });

  it("exhausts retries on persistent 5xx", async () => {
    const fn = vi.fn().mockRejectedValue(new HubSpotApiError("boom", 503));
    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
    const assertion = expect(promise).rejects.toThrow("boom");
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("caps Retry-After delays at 60 seconds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new HubSpotRateLimitError(120_000))
      .mockResolvedValueOnce("ok");

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 });
    await vi.advanceTimersByTimeAsync(60_000);
    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
