"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitRequest } from "@/lib/submit";

export function RecordAction({ url, label = "Remove", confirmation, method = "DELETE", body, redirectTo }: {
  url: string; label?: string; confirmation: string; method?: "DELETE" | "PATCH"; body?: unknown; redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function run() {
    if (!window.confirm(confirmation)) return;
    setBusy(true); setError("");
    const result = await submitRequest(url, { method, ...(body ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}) });
    if (!result.ok) { setError(result.message); setBusy(false); return; }
    if (redirectTo) router.push(redirectTo);
    router.refresh(); setBusy(false);
  }
  return <div className="print:hidden"><Button type="button" size="sm" variant="ghost" onClick={run} disabled={busy}>{busy ? "Saving…" : label}</Button>{error && <p role="alert" className="text-xs text-accent-deep">{error}</p>}</div>;
}
