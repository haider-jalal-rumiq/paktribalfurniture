"use client";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FormSection, StickyActions } from "@/components/cms/cms-page";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { invoiceInputSchema } from "@/features/cms/accounting.schema";
import { invoiceTotal } from "@/lib/accounting-core";
import { today } from "@/lib/cms-core";
import { formatPkr, parseAmount } from "@/lib/money";
import { submitRequest } from "@/lib/submit";
import type { Client, Invoice } from "@/types/database";

type DraftItem = { id: string; item: string; quantity: string; amount: string; source: string };
export function InvoiceForm({ invoice, clients, defaultClientId }: { invoice?: Invoice; clients: Client[]; defaultClientId?: string }) {
  const router = useRouter(), requestId = useRef(invoice?.id ?? "");
  const [items, setItems] = useState<DraftItem[]>(invoice?.items.map((row) => ({ ...row, amount: String(row.amount), quantity: String(row.quantity) })) ?? []);
  const [saving, setSaving] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState("");
  const amounts = items.map((row) => ({ amount: parseAmount(row.amount), quantity: Number(row.quantity) }));
  const validAmounts = amounts.every((row) => row.amount !== null && Number.isInteger(row.quantity) && row.quantity > 0 && row.quantity <= 10000);
  const total = validAmounts ? invoiceTotal(amounts as { amount: number; quantity: number }[]) : null;
  function update(id: string, patch: Partial<DraftItem>) { setItems(items.map((row) => row.id === id ? { ...row, ...patch } : row)); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    requestId.current ||= crypto.randomUUID();
    const parsed = invoiceInputSchema.safeParse({ ...Object.fromEntries(new FormData(event.currentTarget)), id: requestId.current, items });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the invoice."); return; }
    setSaving(true);
    const result = await submitRequest(invoice ? `/api/cms/invoices/${invoice.id}` : "/api/cms/invoices", {
      method: invoice ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data),
    });
    if (!result.ok || !result.id) { setError(result.message || "The invoice could not be saved."); setSaving(false); return; }
    setSaved(true); router.push(`/cms/invoices/${result.id}`); router.refresh();
  }
  if (!clients.length) return <p className="text-sm text-muted">Add a client before creating an invoice. <Link className="font-semibold text-accent" href="/cms/clients/new">Add client</Link></p>;
  return <form onSubmit={submit} className="space-y-4">
    <FormSection title="Invoice details">
      <Field label="Client" htmlFor="invoiceClient"><Select id="invoiceClient" name="clientId" defaultValue={invoice?.client_id ?? defaultClientId ?? ""} required><option value="" disabled>Choose a client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select></Field>
      <Field label="Invoice date" htmlFor="issuedOn"><Input id="issuedOn" name="issuedOn" type="date" defaultValue={invoice?.issued_on ?? today()} required /></Field>
    </FormSection>
    <FormSection title="Items" hint="Enter the amount per unit. The total includes quantity.">
      <div className="space-y-4 sm:col-span-2">
        {items.map((row, index) => <fieldset key={row.id} className="rounded-[var(--radius-ui)] border border-hairline p-4">
          <legend className="px-2 text-xs font-bold text-muted">Item {index + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Item" htmlFor={`inv-item-${row.id}`}><Input id={`inv-item-${row.id}`} value={row.item} onChange={(e) => update(row.id, { item: e.target.value })} maxLength={200} required /></Field>
            <Field label="Stock / order" htmlFor={`source-${row.id}`}><Input id={`source-${row.id}`} value={row.source} onChange={(e) => update(row.id, { source: e.target.value })} placeholder="Type stock or order" maxLength={80} required /></Field>
            <Field label="Quantity" htmlFor={`inv-qty-${row.id}`}><Input id={`inv-qty-${row.id}`} type="number" min={1} max={10000} step={1} value={row.quantity} onChange={(e) => update(row.id, { quantity: e.target.value })} required /></Field>
            <Field label="Unit amount (Rs)" htmlFor={`rate-${row.id}`}><Input id={`rate-${row.id}`} inputMode="numeric" value={row.amount} onChange={(e) => update(row.id, { amount: e.target.value })} required /></Field>
          </div>
          <Button type="button" size="sm" variant="ghost" className="mt-3" onClick={() => setItems(items.filter((item) => item.id !== row.id))}><Trash2 className="h-4 w-4" aria-hidden="true" />Remove item {index + 1}</Button>
        </fieldset>)}
        <Button type="button" size="sm" variant="outline" disabled={items.length >= 100} onClick={() => setItems([...items, { id: crypto.randomUUID(), item: "", quantity: "1", amount: "", source: "" }])}><Plus className="h-4 w-4" aria-hidden="true" />Add invoice item</Button>
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-hairline pt-4"><span className="font-semibold text-ink-soft">Total amount</span><output className="break-all text-xl font-bold tabular-nums text-accent">{total !== null ? formatPkr(total) : "Enter valid amounts"}</output></div>
      </div>
    </FormSection>
    <FormSection title="Notes"><Field label="Invoice note" htmlFor="invoiceNotes" className="sm:col-span-2"><Textarea id="invoiceNotes" name="notes" maxLength={2000} defaultValue={invoice?.notes ?? ""} /></Field></FormSection>
    <p className="text-sm text-muted">Saving adds this invoice to Total sales. Record received money separately with Add balance.</p>
    {error && <p role="alert" className="text-sm text-accent-deep">{error}</p>}
    <StickyActions><Button type="submit" disabled={saving || saved}>{saved ? "Saved — opening" : saving ? "Saving…" : "Save invoice"}</Button></StickyActions>
  </form>;
}
