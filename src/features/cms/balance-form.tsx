"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { balanceInputSchema } from "@/features/cms/accounting.schema";
import { today } from "@/lib/cms-core";
import { postJson } from "@/lib/submit";

export function BalanceForm() {
  const router = useRouter(), form = useRef<HTMLFormElement>(null), requestId = useRef("");
  const [saving, setSaving] = useState(false), [error, setError] = useState(""), [saved, setSaved] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaved(false);
    requestId.current ||= crypto.randomUUID();
    const parsed = balanceInputSchema.safeParse({ ...Object.fromEntries(new FormData(event.currentTarget)), id: requestId.current });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the balance."); return; }
    setSaving(true);
    const result = await postJson("/api/cms/balances", parsed.data);
    setSaving(false);
    if (!result.ok) { setError(result.message); return; }
    requestId.current = ""; form.current?.reset(); setSaved(true); router.refresh();
  }
  return <form ref={form} onSubmit={submit} className="space-y-4 rounded-[var(--radius-card)] border border-hairline bg-surface p-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Amount to add (Rs)" htmlFor="balanceAmount"><Input id="balanceAmount" name="amount" inputMode="numeric" required /></Field>
      <Field label="Received on" htmlFor="receivedOn"><Input id="receivedOn" name="receivedOn" type="date" defaultValue={today()} required /></Field>
      <Field label="Description" htmlFor="balanceNote" className="sm:col-span-2" hint="Opening balance, cash received, or other funds added."><Input id="balanceNote" name="note" maxLength={400} required /></Field>
    </div>
    {error && <p role="alert" className="text-sm text-accent-deep">{error}</p>}
    {saved && <p role="status" className="text-sm text-status-good">Balance added.</p>}
    <Button type="submit" disabled={saving}>{saving ? "Adding…" : "Add balance"}</Button>
  </form>;
}
