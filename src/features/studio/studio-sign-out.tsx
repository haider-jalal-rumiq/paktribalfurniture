"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function StudioSignOut() {
  const router = useRouter();
  async function signOut() {
    await getSupabaseBrowserClient()?.auth.signOut();
    router.replace("/studio/login");
    router.refresh();
  }
  return <button type="button" onClick={signOut} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-soft hover:text-accent"><LogOut className="h-4 w-4" aria-hidden="true" />Sign out</button>;
}
