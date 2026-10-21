/**
 * Helpers for consistent API response shapes.
 *
 * All Route Handlers use these utilities so error formats are predictable
 * for both the frontend and automated tests.
 */

import {
  HubSpotRateLimitError,
  HubSpotNotFoundError,
  HubSpotApiError,
} from "@/server/hubspot/contactsApi";

/** Standard error response body returned by all Route Handlers. */
export type ApiError = {
  error: string;
  code: string;
};

export function ok<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function created<T>(data: T): Response {
  return Response.json(data, { status: 201 });
}

export function badRequest(message: string): Response {
  return Response.json({ error: message, code: "BAD_REQUEST" } satisfies ApiError, {
    status: 400,
  });
}

export function notFound(message = "Not found"): Response {
  return Response.json({ error: message, code: "NOT_FOUND" } satisfies ApiError, {
    status: 404,
  });
}

export function conflict(message: string): Response {
  return Response.json({ error: message, code: "CONFLICT" } satisfies ApiError, {
    status: 409,
  });
}

export function tooManyRequests(retryAfterMs: number): Response {
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
  return Response.json(
    {
      error: `Rate limit exceeded. Retry after ${retryAfterSeconds}s.`,
      code: "RATE_LIMITED",
    } satisfies ApiError,
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

export function internalError(message = "Internal server error"): Response {
  return Response.json({ error: message, code: "INTERNAL_ERROR" } satisfies ApiError, {
    status: 500,
  });
}

/**
 * Translate a thrown error from the service/HubSpot layer into an HTTP
 * response. Avoids leaking internal details to the client.
 */
export function handleServiceError(err: unknown): Response {
  if (err instanceof HubSpotRateLimitError) {
    return tooManyRequests(err.retryAfterMs);
  }
  if (err instanceof HubSpotNotFoundError) {
    return notFound("Contact not found");
  }
  if (err instanceof HubSpotApiError) {
    if (err.statusCode === 401 || err.statusCode === 403) {
      return Response.json(
        { error: "HubSpot authentication failed. Check your token.", code: "UNAUTHORIZED" } satisfies ApiError,
        { status: 502 },
      );
    }
    return internalError("HubSpot API error");
  }
  // Unknown errors — log on the server, return a generic 500.
  console.error("[Route Handler] Unhandled error:", err);
  return internalError();
}
