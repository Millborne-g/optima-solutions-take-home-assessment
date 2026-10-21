/**
 * Minimal TypeScript representation of the Supabase `public` schema.
 *
 * Matches migrations 001_contacts.sql and 002_order_syncs.sql.
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
      order_syncs: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          raw_payload: Json;
          hubspot_contact_id: string | null;
          hubspot_deal_id: string | null;
          error_message: string | null;
          attempt_count: number;
          last_attempted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status?: string;
          raw_payload: Json;
          hubspot_contact_id?: string | null;
          hubspot_deal_id?: string | null;
          error_message?: string | null;
          attempt_count?: number;
          last_attempted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          status?: string;
          raw_payload?: Json;
          hubspot_contact_id?: string | null;
          hubspot_deal_id?: string | null;
          error_message?: string | null;
          attempt_count?: number;
          last_attempted_at?: string | null;
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
