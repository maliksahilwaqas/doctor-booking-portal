import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { supabaseUrl } from "./env";

/**
 * Service-role client. Bypasses Row Level Security entirely -- never import
 * this from a Client Component, and only use it where RLS genuinely can't
 * express the check (nothing in this app currently needs it).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createSupabaseClient<Database>(supabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
