"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { orderStatuses } from "@/content/cms";
import { orderTotal } from "@/lib/accounting-core";
import { formatPkr, parseAmount } from "@/lib/money";
import type { InventoryItem, OrderItem } from "@/types/database";

/**
 * `stock` is the factory inventory. Naming an item that exists there fills its
 * price, so a standard piece is not re-priced by hand every time. Nothing is
 * deducted here: stock only moves when the work is invoiced.
 */
export function OrderItemEditor({ items, onChange, stock = [] }: { items: OrderItem[]; onChange: (items: OrderItem[]) => void; stock?: InventoryItem[] }) {
  function update(id: string, change: Partial<OrderItem>) {
    onChange(items.map((item) => item.id === id ? { ...item, ...change } : item));
  }
  /** An exact name match prices the line; anything custom is left alone. */
  function named(id: string, name: string) {
    const match = stock.find((entry) => entry.name.toLowerCase() === name.trim().toLowerCase());
    update(id, match && match.price > 0 ? { name, amount: match.price } : { name });
  }
  return <div className="space-y-3 sm:col-span-2">
    <input type="hidden" name="items" value={JSON.stringify(items)} />
    <datalist id="order-item-names">{stock.map((entry) => <option key={entry.id} value={entry.name} />)}</datalist>
    {items.map((item, index) => <fieldset key={item.id} className="rounded-[var(--radius-ui)] border border-hairline p-4">
      <legend className="px-2 text-xs font-bold text-muted">Item {index + 1}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Item name" htmlFor={`item-${item.id}`} hint={stock.length ? "Naming a stock item fills its price." : undefined}><Input id={`item-${item.id}`} list="order-item-names" value={item.name} onChange={(e) => named(item.id, e.target.value)} required maxLength={200} /></Field>
        <Field label="Quantity" htmlFor={`qty-${item.id}`}><Input id={`qty-${item.id}`} type="number" min={1} max={10000} step={1} value={item.quantity || ""} onChange={(e) => update(item.id, { quantity: Number(e.target.value) })} required /></Field>
        <Field label="Price per piece (Rs)" htmlFor={`amount-${item.id}`} hint={item.quantity > 1 ? `Line total ${formatPkr(orderTotal([item]))}` : "Leave 0 until a price is agreed."}>
          <Input id={`amount-${item.id}`} inputMode="numeric" value={String(item.amount ?? 0)} onChange={(e) => update(item.id, { amount: parseAmount(e.target.value) ?? 0 })} required />
        </Field>
        <Field label="Item status" htmlFor={`status-${item.id}`}><Select id={`status-${item.id}`} value={item.status} onChange={(e) => update(item.id, { status: e.target.value })}>{orderStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select></Field>
        <Field label="Item details" htmlFor={`notes-${item.id}`}><Input id={`notes-${item.id}`} value={item.notes} onChange={(e) => update(item.id, { notes: e.target.value })} maxLength={1000} /></Field>
      </div>
      <Button type="button" size="sm" variant="ghost" className="mt-3" onClick={() => onChange(items.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4" aria-hidden="true" />Remove item {index + 1}</Button>
    </fieldset>)}
    {items.length > 0 && <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-hairline pt-3">
      <span className="text-sm font-semibold text-ink-soft">Order value</span>
      <output className="break-all text-lg font-bold tabular-nums text-accent">{formatPkr(orderTotal(items))}</output>
    </div>}
    {!items.length && <p className="text-sm text-muted">Add each piece separately to track its progress.</p>}
    <Button type="button" variant="outline" size="sm" disabled={items.length >= 100} onClick={() => onChange([...items, { id: crypto.randomUUID(), name: "", quantity: 1, status: "pending", notes: "", amount: 0 }])}><Plus className="h-4 w-4" aria-hidden="true" />Add item</Button>
  </div>;
}
