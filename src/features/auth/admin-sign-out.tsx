"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminSignOut({ redirectTo = "/studio/login", className }: { redirectTo?: string; className?: string }) {
  const router = useRouter();
  async function signOut() {
    await getSupabaseBrowserClient()?.auth.signOut();
    router.replace(redirectTo);
    router.refresh();
  }
  return <button type="button" onClick={signOut} className={cn("inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-soft hover:text-accent", className)}><LogOut className="h-4 w-4" aria-hidden="true" />Sign out</button>;
}
