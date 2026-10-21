/**
 * Contact domain types.
 *
 * These types mirror the HubSpot CRM v3 contact properties used by this
 * application. They are shared across client components, server modules, and
 * tests — keep them framework-agnostic.
 */

/** A fully resolved contact record, as returned by the API layer. */
export type Contact = {
  /** HubSpot internal contact ID (stable; use as a key). */
  id: string;
  firstName: string | null;
  lastName: string | null;
  /** Primary email address — treated as unique within HubSpot. */
  email: string;
  phone: string | null;
  /** ISO-8601 timestamp from HubSpot (createdate property). */
  createdAt: string | null;
  /** ISO-8601 timestamp from HubSpot (lastmodifieddate property). */
  updatedAt: string | null;
};

/** Fields accepted when creating a new contact. */
export type CreateContactInput = {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
};

/** Fields accepted when updating an existing contact (all optional). */
export type UpdateContactInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

/**
 * Result of an upsert operation.
 * `wasUpdated: true` means an existing contact was found by email and patched.
 * `wasUpdated: false` means a brand-new contact was created.
 */
export type UpsertContactResult = {
  contact: Contact;
  wasUpdated: boolean;
};

/** Paginated list of contacts with a cursor for the next page. */
export type ContactsPage = {
  contacts: Contact[];
  /** Pass this value as `after` to fetch the next page. Null when no more pages. */
  nextCursor: string | null;
};
