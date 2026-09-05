"use client";

import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminLoginForm({ redirectTo = "/studio" }: { redirectTo?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured for this deployment.");
      setLoading(false);
      return;
    }
    // signInWithPassword rejects outright on a network failure, so without this
    // catch a dropped connection leaves the button spinning with no message.
    let authError: unknown = null;
    try {
      ({ error: authError } = await supabase.auth.signInWithPassword({
        email: String(form.get("email")),
        password: String(form.get("password")),
      }));
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
      return;
    }
    if (authError) {
      setError("The email or password is not correct.");
      setLoading(false);
      return;
    }
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" required /></Field>
      <Field label="Password" htmlFor="password"><Input id="password" name="password" type="password" autoComplete="current-password" required /></Field>
      {error && <p role="alert" className="text-sm text-accent-deep">{error}</p>}
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}
        {loading ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
