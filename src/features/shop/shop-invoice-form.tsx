"use client";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { FormSection, StickyActions } from "@/components/cms/cms-page";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { shopInvoiceInputSchema } from "@/features/shop/shop.schema";
import { invoiceTotal, shopSaleAmounts } from "@/lib/accounting-core";
import { today } from "@/lib/cms-core";
import { formatPkr, parseAmount } from "@/lib/money";
import { submitRequest } from "@/lib/submit";
import type { ShopSale } from "@/types/database";

type DraftItem = { id: string; item: string; quantity: string; amount: string; source: string };

const blank = (): DraftItem => ({ id: crypto.randomUUID(), item: "", quantity: "1", amount: "", source: "Stock" });

export function ShopInvoiceForm({ stock }: { stock: ShopSale[] }) {
  const router = useRouter();
  const requestId = useRef("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const amounts = items.map((row) => ({ amount: parseAmount(row.amount), quantity: Number(row.quantity) }));
  const valid = amounts.every((row) => row.amount !== null && Number.isInteger(row.quantity) && row.quantity > 0 && row.quantity <= 10000);
  const total = valid ? invoiceTotal(amounts as { amount: number; quantity: number }[]) : null;

  function update(id: string, patch: Partial<DraftItem>) {
    setItems((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  /** Pull a ledger row in at its sale price rather than retyping it. */
  function addFromStock(saleId: string) {
    const sale = stock.find((row) => row.id === saleId);
    if (!sale) return;
    setItems((rows) => [...rows, {
      id: crypto.randomUUID(), item: sale.name, quantity: "1",
      amount: String(shopSaleAmounts(sale).sale), source: `Sale #${sale.sale_no}`,
    }]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    requestId.current ||= crypto.randomUUID();
    const parsed = shopInvoiceInputSchema.safeParse({
      ...Object.fromEntries(new FormData(event.currentTarget)), id: requestId.current, items,
    });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the invoice."); return; }

    setSaving(true);
    const result = await submitRequest("/api/shop/invoices", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data),
    }, "The invoice could not be saved.");
    if (!result.ok || !result.id) { setError(result.message); setSaving(false); return; }

    setSaved(true);
    router.push(`/shop/invoices/${result.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormSection title="Customer" hint="A counter sale needs no client record — type the name.">
        <Field label="Customer name" htmlFor="customerName"><Input id="customerName" name="customerName" maxLength={140} required /></Field>
        <Field label="Phone" htmlFor="customerPhone"><Input id="customerPhone" name="customerPhone" type="tel" maxLength={30} placeholder="Optional" /></Field>
        <Field label="Address" htmlFor="customerAddress"><Input id="customerAddress" name="customerAddress" maxLength={400} placeholder="Optional" /></Field>
        <Field label="Invoice date" htmlFor="issuedOn"><Input id="issuedOn" name="issuedOn" type="date" defaultValue={today()} required /></Field>
      </FormSection>

      <FormSection title="Items" hint="Enter the amount per unit. The total includes quantity.">
        <div className="space-y-4 sm:col-span-2">
          {items.map((row, index) => (
            <fieldset key={row.id} className="rounded-[var(--radius-ui)] border border-hairline p-4">
              <legend className="px-2 text-xs font-bold text-muted">Item {index + 1}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Item" htmlFor={`shop-item-${row.id}`}><Input id={`shop-item-${row.id}`} value={row.item} onChange={(e) => update(row.id, { item: e.target.value })} maxLength={200} required /></Field>
                <Field label="Stock / order" htmlFor={`shop-source-${row.id}`}><Input id={`shop-source-${row.id}`} value={row.source} onChange={(e) => update(row.id, { source: e.target.value })} maxLength={80} required /></Field>
                <Field label="Quantity" htmlFor={`shop-qty-${row.id}`}><Input id={`shop-qty-${row.id}`} type="number" min={1} max={10000} step={1} value={row.quantity} onChange={(e) => update(row.id, { quantity: e.target.value })} required /></Field>
                <Field label="Unit amount (Rs)" htmlFor={`shop-rate-${row.id}`}><Input id={`shop-rate-${row.id}`} inputMode="numeric" value={row.amount} onChange={(e) => update(row.id, { amount: e.target.value })} required /></Field>
              </div>
              <Button type="button" size="sm" variant="ghost" className="mt-3" onClick={() => setItems(items.filter((item) => item.id !== row.id))}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />Remove item {index + 1}
              </Button>
            </fieldset>
          ))}

          <div className="flex flex-wrap items-end gap-3">
            <Button type="button" size="sm" variant="outline" disabled={items.length >= 100} onClick={() => setItems([...items, blank()])}>
              <Plus className="h-4 w-4" aria-hidden="true" />Add item
            </Button>
            {stock.length > 0 && (
              <Field label="Add from the shop ledger" htmlFor="fromStock" className="min-w-56 flex-1">
                <Select id="fromStock" value="" disabled={items.length >= 100} onChange={(event) => addFromStock(event.target.value)}>
                  <option value="">Choose a sale…</option>
                  {stock.map((sale) => (
                    <option key={sale.id} value={sale.id}>#{sale.sale_no} · {sale.name} · {formatPkr(shopSaleAmounts(sale).sale)}</option>
                  ))}
                </Select>
              </Field>
            )}
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-hairline pt-4">
            <span className="font-semibold text-ink-soft">Total amount</span>
            <output className="break-all text-xl font-bold tabular-nums text-accent">{total !== null ? formatPkr(total) : "Enter valid amounts"}</output>
          </div>
        </div>
      </FormSection>

      <FormSection title="Notes">
        <Field label="Invoice note" htmlFor="shopNotes" className="sm:col-span-2"><Textarea id="shopNotes" name="notes" maxLength={2000} /></Field>
      </FormSection>

      {error && <p role="alert" className="text-sm text-accent-deep">{error}</p>}
      <StickyActions>
        <Button type="submit" disabled={saving || saved}>{saved ? "Saved — opening" : saving ? "Saving…" : "Save invoice"}</Button>
      </StickyActions>
    </form>
  );
}
