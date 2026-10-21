import "server-only";
import type { Contact } from "@/entities/contact/model/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "./client";

/**
 * Supabase contacts repository.
 *
 * All interactions with the `contacts` table go through this module.
 * HubSpot is the source of truth — Supabase stores a local sync cache.
 */

type ContactRow = {
  id: string;
  hubspot_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
};

function rowToContact(row: ContactRow): Contact {
  return {
    id: row.hubspot_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Insert or update a contact keyed by `hubspot_id`.
 *
 * On conflict (same `hubspot_id`), all columns are overwritten to keep the
 * local cache in sync with HubSpot.
 *
 * @returns The upserted row, or `null` when the DB call fails (caller decides
 *          whether to surface the error or continue without local persistence).
 */
export async function upsertContact(
  contact: Contact,
): Promise<Contact | null> {
  const supabase = getSupabaseServiceClient();
  const now = new Date().toISOString();

  const upsertData = {
    hubspot_id: contact.id,
    email: contact.email,
    first_name: contact.firstName ?? null,
    last_name: contact.lastName ?? null,
    phone: contact.phone ?? null,
    synced_at: now,
    updated_at: now,
  };

  // Cast to untyped client: the Database generic introduces complex inference
  // issues with Supabase v2 under strict TS. Row shape is validated via ContactRow.
  const untypedClient = supabase as unknown as SupabaseClient;
  const { data, error } = await untypedClient
    .from("contacts")
    .upsert(upsertData, { onConflict: "hubspot_id" })
    .select()
    .single();

  if (error) {
    // Log but do not throw — the caller handles partial-failure semantics.
    console.error("[Supabase] upsertContact error:", {
      code: error.code,
      message: error.message,
      hubspot_id: contact.id,
    });
    return null;
  }

  return rowToContact(data as ContactRow);
}

/**
 * Look up a locally cached contact by its HubSpot ID.
 *
 * Returns `null` if not found or on DB error.
 */
export async function findByHubspotId(
  hubspotId: string,
): Promise<Contact | null> {
  const supabase = getSupabaseServiceClient();

  const untypedClient = supabase as unknown as SupabaseClient;
  const { data, error } = await untypedClient
    .from("contacts")
    .select("*")
    .eq("hubspot_id", hubspotId)
    .maybeSingle();

  if (error) {
    console.error("[Supabase] findByHubspotId error:", {
      code: error.code,
      message: error.message,
      hubspot_id: hubspotId,
    });
    return null;
  }

  if (!data) return null;
  return rowToContact(data as ContactRow);
}
