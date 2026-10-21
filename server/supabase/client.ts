import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client that uses the service-role key.
 *
 * This module is server-only. The service-role key bypasses Row Level Security
 * — it must NEVER be imported by client components or exposed to the browser.
 */

function createSupabaseServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. " +
        "Copy it from your Supabase project dashboard → Project Settings → API.",
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. " +
        "Copy it from your Supabase project dashboard → Project Settings → API. " +
        "This key is server-only — never expose it to the browser.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      // Service-role clients should not persist sessions.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabase: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = createSupabaseServiceClient();
  }
  return _supabase;
}
