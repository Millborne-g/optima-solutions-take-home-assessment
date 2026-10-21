import "server-only";
import { FilterOperatorEnum } from "@hubspot/api-client/lib/codegen/crm/contacts/index";
import type { Contact, ContactsPage } from "@/entities/contact/model/types";
import type {
  CreateContactInput,
  UpdateContactInput,
} from "@/entities/contact/model/schema";
import { getHubSpotClient } from "./client";

/**
 * The HubSpot contact properties fetched in every request.
 * Keep this list in sync with the `Contact` type in entities/contact/model/types.ts.
 */
const CONTACT_PROPERTIES = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "createdate",
  "lastmodifieddate",
];

// ---------------------------------------------------------------------------
// Typed error for HubSpot rate-limit responses
// ---------------------------------------------------------------------------

export class HubSpotRateLimitError extends Error {
  /** Milliseconds to wait before retrying, parsed from Retry-After header. */
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super(`HubSpot rate limit exceeded. Retry after ${retryAfterMs}ms.`);
    this.name = "HubSpotRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

export class HubSpotNotFoundError extends Error {
  constructor(id: string) {
    super(`HubSpot contact not found: ${id}`);
    this.name = "HubSpotNotFoundError";
  }
}

export class HubSpotApiError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "HubSpotApiError";
    this.statusCode = statusCode;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Map a raw HubSpot contact object to our `Contact` domain type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapContact(raw: any): Contact {
  const p = raw.properties ?? {};
  return {
    id: String(raw.id),
    firstName: p.firstname ?? null,
    lastName: p.lastname ?? null,
    email: p.email ?? "",
    phone: p.phone ?? null,
    createdAt: p.createdate ?? null,
    updatedAt: p.lastmodifieddate ?? null,
  };
}

/**
 * Extract a retry delay from a HubSpot SDK error.
 * The SDK wraps HTTP errors; the response body usually contains a `retryAfter`
 * field, and the HTTP response has a `Retry-After` header (in seconds).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRetryAfterMs(err: any): number {
  // SDK error shape: err.response?.headers?.['retry-after'] (string, seconds)
  const headerValue = err?.response?.headers?.["retry-after"];
  if (headerValue) {
    const seconds = parseFloat(headerValue);
    if (!isNaN(seconds)) return Math.ceil(seconds * 1000);
  }
  // Fallback: 10 s
  return 10_000;
}

/**
 * Translate SDK/HTTP errors into our typed domain errors.
 * Rethrows as-is if not a recognisable HubSpot error.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function translateError(err: any): never {
  const status: number = err?.code ?? err?.response?.status ?? 0;
  if (status === 429) {
    throw new HubSpotRateLimitError(extractRetryAfterMs(err));
  }
  if (status === 404) {
    throw new HubSpotNotFoundError(String(err?.response?.body?.id ?? "unknown"));
  }
  if (status >= 400) {
    const message =
      err?.response?.body?.message ??
      err?.message ??
      "HubSpot API error";
    throw new HubSpotApiError(String(message), status);
  }
  throw err;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * List contacts with cursor-based pagination.
 *
 * @param after  Cursor from a previous `ContactsPage.nextCursor`. Pass
 *               `undefined` to start from the first page.
 * @param limit  Maximum results per page (1–100, default 20).
 */
export async function listContacts(
  after?: string,
  limit = 20,
): Promise<ContactsPage> {
  const client = getHubSpotClient();
  try {
    const response = await client.crm.contacts.basicApi.getPage(
      limit,
      after,
      undefined,
      CONTACT_PROPERTIES,
    );
    const contacts = (response.results ?? []).map(mapContact);
    const nextCursor = response.paging?.next?.after ?? null;
    return { contacts, nextCursor };
  } catch (err) {
    translateError(err);
  }
}

/**
 * Fetch a single contact by its HubSpot ID.
 */
export async function getContactById(id: string): Promise<Contact> {
  const client = getHubSpotClient();
  try {
    const response = await client.crm.contacts.basicApi.getById(
      id,
      CONTACT_PROPERTIES,
    );
    return mapContact(response);
  } catch (err) {
    translateError(err);
  }
}

/**
 * Search for a contact by exact email address.
 *
 * Returns `null` if no match is found; throws on API errors.
 */
export async function searchContactByEmail(
  email: string,
): Promise<Contact | null> {
  const client = getHubSpotClient();
  try {
    const response = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "email",
              operator: FilterOperatorEnum.Eq,
              value: email,
            },
          ],
        },
      ],
      properties: CONTACT_PROPERTIES,
      limit: 1,
      after: "0",
      sorts: [],
      query: "",
    });
    const results = response.results ?? [];
    if (results.length === 0) return null;
    return mapContact(results[0]);
  } catch (err) {
    translateError(err);
  }
}

/**
 * Create a new HubSpot contact.
 */
export async function createContact(
  input: CreateContactInput,
): Promise<Contact> {
  const client = getHubSpotClient();
  try {
    const response = await client.crm.contacts.basicApi.create({
      properties: {
        firstname: input.firstName ?? "",
        lastname: input.lastName ?? "",
        email: input.email,
        phone: input.phone ?? "",
      },
      associations: [],
    });
    return mapContact(response);
  } catch (err) {
    translateError(err);
  }
}

/**
 * Update an existing HubSpot contact by ID.
 * Only the provided fields are changed (partial update).
 */
export async function updateContact(
  id: string,
  input: UpdateContactInput,
): Promise<Contact> {
  const client = getHubSpotClient();
  const properties: Record<string, string> = {};
  if (input.firstName !== undefined) properties.firstname = input.firstName;
  if (input.lastName !== undefined) properties.lastname = input.lastName;
  if (input.email !== undefined) properties.email = input.email;
  if (input.phone !== undefined) properties.phone = input.phone;

  try {
    const response = await client.crm.contacts.basicApi.update(id, {
      properties,
    });
    return mapContact(response);
  } catch (err) {
    translateError(err);
  }
}
