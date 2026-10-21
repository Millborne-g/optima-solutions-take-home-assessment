/**
 * Minimal TypeScript representation of the Supabase `public` schema.
 *
 * Generated manually to match `supabase/migrations/001_contacts.sql`.
 * If you add columns, update this file accordingly.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: {
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
        Insert: {
          id?: string;
          hubspot_id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hubspot_id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
