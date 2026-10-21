import "server-only";
import type { Contact, ContactsPage, UpsertContactResult } from "@/entities/contact/model/types";
import type {
  CreateContactInput,
  UpdateContactInput,
} from "@/entities/contact/model/schema";
import {
  listContacts,
  getContactById,
  searchContactByEmail,
  createContact,
  updateContact,
  HubSpotRateLimitError,
} from "@/server/hubspot/contactsApi";
import {
  upsertContact,
  findByHubspotId,
} from "@/server/supabase/contactsRepository";

/**
 * Contacts service.
 *
 * Orchestrates HubSpot API calls and Supabase synchronisation.
 * All methods are server-only.
 *
 * Design principle: HubSpot is the source of truth.
 * - HubSpot failures are surfaced to the caller as thrown errors.
 * - Supabase sync failures are logged and swallowed — the response still
 *   includes the HubSpot data so the caller always gets a useful result.
 */

// ---------------------------------------------------------------------------
// List contacts
// ---------------------------------------------------------------------------

/**
 * Fetch a page of contacts from HubSpot and sync them to Supabase.
 *
 * Supabase sync errors are logged but do not affect the returned data.
 */
export async function getContacts(
  after?: string,
  limit = 20,
): Promise<ContactsPage> {
  const page = await listContacts(after, limit);

  // Sync in the background (best-effort, non-blocking).
  syncContactsToSupabase(page.contacts).catch((err) => {
    console.error("[ContactsService] Background sync error:", err);
  });

  return page;
}

async function syncContactsToSupabase(contacts: Contact[]): Promise<void> {
  await Promise.allSettled(contacts.map((c) => upsertContact(c)));
}

// ---------------------------------------------------------------------------
// Get single contact
// ---------------------------------------------------------------------------

export async function getContact(id: string): Promise<Contact> {
  const contact = await getContactById(id);

  // Best-effort sync.
  upsertContact(contact).catch((err) => {
    console.error("[ContactsService] Sync error for contact", id, err);
  });

  return contact;
}

// ---------------------------------------------------------------------------
// Upsert by email (create or update)
// ---------------------------------------------------------------------------

/**
 * Create a new contact or update the existing one if the email already exists.
 *
 * Flow:
 * 1. Search HubSpot by email.
 * 2a. If found → patch the existing contact with any provided fields.
 * 2b. If not found → create a brand-new contact.
 * 3. Sync the resulting contact to Supabase (best-effort).
 *
 * @throws HubSpotRateLimitError   When HubSpot returns 429.
 * @throws HubSpotApiError         On other HubSpot API failures.
 */
export async function upsertContactByEmail(
  input: CreateContactInput,
): Promise<UpsertContactResult> {
  // Step 1: Check for an existing contact by email.
  const existing = await searchContactByEmail(input.email);

  let contact: Contact;
  let wasUpdated: boolean;

  if (existing) {
    // Step 2a: Update the existing contact.
    const updatePayload: UpdateContactInput = {};
    if (input.firstName !== undefined) updatePayload.firstName = input.firstName;
    if (input.lastName !== undefined) updatePayload.lastName = input.lastName;
    if (input.phone !== undefined) updatePayload.phone = input.phone;
    // Do not overwrite the email — it is the key we searched on.

    contact = await updateContact(existing.id, updatePayload);
    wasUpdated = true;
  } else {
    // Step 2b: Create a new contact.
    contact = await createContact(input);
    wasUpdated = false;
  }

  // Step 3: Sync to Supabase (best-effort — failure does not affect the response).
  const syncResult = await upsertContact(contact);
  if (!syncResult) {
    console.warn(
      "[ContactsService] Supabase sync failed after HubSpot",
      wasUpdated ? "update" : "create",
      "for contact",
      contact.id,
      "— local cache may be stale.",
    );
  }

  return { contact, wasUpdated };
}

// ---------------------------------------------------------------------------
// Update existing contact by ID
// ---------------------------------------------------------------------------

/**
 * Update a specific contact by its HubSpot ID.
 * Syncs the result to Supabase (best-effort).
 */
export async function updateContactById(
  id: string,
  input: UpdateContactInput,
): Promise<Contact> {
  const contact = await updateContact(id, input);

  upsertContact(contact).catch((err) => {
    console.error("[ContactsService] Sync error after update for", id, err);
  });

  return contact;
}

// ---------------------------------------------------------------------------
// Re-export typed error for use in Route Handlers
// ---------------------------------------------------------------------------
export { HubSpotRateLimitError };

// Re-export findByHubspotId for any Route Handler that needs local lookup
export { findByHubspotId };
