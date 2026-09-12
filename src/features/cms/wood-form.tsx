"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { FormSection, StickyActions } from "@/components/cms/cms-page";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { woodInputSchema } from "@/features/cms/accounting.schema";
import { woodTotals } from "@/lib/accounting-core";
import { currentMonth, today } from "@/lib/cms-core";
import { formatPkr, parseAmount } from "@/lib/money";
import { submitRequest } from "@/lib/submit";
import type { WoodEntry } from "@/types/database";

const money = (value: number | undefined) => String(value ?? 0);

export function WoodForm({ entry, month, purchasers }: { entry?: WoodEntry; month?: string; purchasers: string[] }) {
  const router = useRouter();
  const requestId = useRef(entry?.id ?? "");
  const [purchased, setPurchased] = useState(money(entry?.purchased_amount));
  const [paid, setPaid] = useState(money(entry?.paid_amount));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const purchasedAmount = parseAmount(purchased);
  const paidAmount = parseAmount(paid);
  const totals = purchasedAmount !== null && paidAmount !== null
    ? woodTotals([{ purchased_amount: purchasedAmount, paid_amount: paidAmount }])
    : null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    requestId.current ||= crypto.randomUUID();
    const parsed = woodInputSchema.safeParse({ ...Object.fromEntries(new FormData(event.currentTarget)), id: requestId.current });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the wood entry."); return; }
    setSaving(true);
    const result = await submitRequest(entry ? `/api/cms/wood/${entry.id}` : "/api/cms/wood", {
      method: entry ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    }, "The wood entry could not be saved.");
    if (!result.ok) { setError(result.message); setSaving(false); return; }
    setSaved(true);
    router.push(`/factory/expenses/wood?month=${parsed.data.period}`);
    router.refresh();
  }

  return <form onSubmit={submit} className="space-y-4">
    <FormSection title="Purchaser and month">
      <Field label="Wood purchaser name" htmlFor="woodPurchaser">
        <Input id="woodPurchaser" name="purchaserName" list="woodPurchasers" maxLength={140} defaultValue={entry?.purchaser_name} required />
        <datalist id="woodPurchasers">{purchasers.map((name) => <option key={name} value={name} />)}</datalist>
      </Field>
      <Field label="Purchase month" htmlFor="woodPeriod">
        <Input id="woodPeriod" name="period" type="month" defaultValue={entry?.period.slice(0, 7) ?? month ?? currentMonth()} required />
      </Field>
    </FormSection>

    <FormSection title="Purchase and payment" hint="A payment can be entered even when no new wood was purchased, so an older balance can be cleared.">
      <Field label="Wood purchased (Rs)" htmlFor="woodPurchased" hint={purchasedAmount !== null ? formatPkr(purchasedAmount) : undefined}>
        <Input id="woodPurchased" name="purchasedAmount" inputMode="numeric" value={purchased} onChange={(event) => setPurchased(event.target.value)} required />
      </Field>
      <Field label="Payment made (Rs)" htmlFor="woodPaid" hint={paidAmount !== null ? formatPkr(paidAmount) : undefined}>
        <Input id="woodPaid" name="paidAmount" inputMode="numeric" value={paid} onChange={(event) => setPaid(event.target.value)} required />
      </Field>
      <Field label="Payment date" htmlFor="woodPaidOn" hint="This date decides which month's general expense includes the payment.">
        <Input id="woodPaidOn" name="paidOn" type="date" defaultValue={entry?.paid_on ?? today()} required />
      </Field>
      <Field label="Notes" htmlFor="woodNotes">
        <Textarea id="woodNotes" name="notes" maxLength={1000} defaultValue={entry?.notes ?? ""} placeholder="Wood type, quantity or invoice details" />
      </Field>
    </FormSection>

    <section className="rounded-[var(--radius-card)] border border-hairline bg-canvas-deep p-4 sm:p-5">
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">This entry</h3>
      {totals ? <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-muted">Wood purchased</dt><dd className="font-semibold tabular-nums">{formatPkr(totals.purchased)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted">Payment made</dt><dd className="font-semibold tabular-nums">− {formatPkr(totals.paid)}</dd></div>
        <div className="flex justify-between gap-3 border-t border-hairline pt-2"><dt className="font-semibold text-ink-soft">Balance change</dt><dd className="font-display text-2xl tabular-nums text-accent">{formatPkr(totals.remaining)}</dd></div>
      </dl> : <p className="mt-3 text-sm text-muted">Enter valid whole-rupee amounts to see the balance.</p>}
      <p className="mt-3 text-xs text-muted">Only the payment made is counted in general expenses. Do not add the same payment again as a separate general expense.</p>
    </section>

    {error && <p role="alert" className="text-sm text-accent-deep">{error}</p>}
    <StickyActions><Button type="submit" disabled={saving || saved}>{saved ? "Saved — opening" : saving ? "Saving…" : "Save wood entry"}</Button></StickyActions>
  </form>;
}
