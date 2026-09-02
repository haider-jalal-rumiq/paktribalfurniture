import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { claimsAreAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export async function getStudioSession(): Promise<{ supabase: SupabaseClient<Database>; userId: string } | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;
  if (error || !claimsAreAdmin(claims) || typeof claims?.sub !== "string") return null;
  return { supabase, userId: claims.sub };
}
