import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Service-role client. It bypasses RLS, so it exists for exactly one reason:
 * the scheduled jobs have no user session and RLS would otherwise block them.
 *
 * Rules, enforced by review not by the compiler:
 *   - only src/app/api/cron/* may import this
 *   - the key is never exposed to the browser (no NEXT_PUBLIC_ prefix)
 *   - every caller checks CRON_SECRET before doing anything
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Constant-time-ish check that the caller is our scheduler. */
export function isAuthorisedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
