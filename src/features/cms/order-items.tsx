"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { orderStatuses } from "@/content/cms";
import type { OrderItem } from "@/types/database";

export function OrderItemEditor({ items, onChange }: { items: OrderItem[]; onChange: (items: OrderItem[]) => void }) {
  function update(id: string, change: Partial<OrderItem>) {
    onChange(items.map((item) => item.id === id ? { ...item, ...change } : item));
  }
  return <div className="space-y-3 sm:col-span-2">
    <input type="hidden" name="items" value={JSON.stringify(items)} />
    {items.map((item, index) => <fieldset key={item.id} className="rounded-[var(--radius-ui)] border border-hairline p-4">
      <legend className="px-2 text-xs font-bold text-muted">Item {index + 1}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Item name" htmlFor={`item-${item.id}`}><Input id={`item-${item.id}`} value={item.name} onChange={(e) => update(item.id, { name: e.target.value })} required maxLength={200} /></Field>
        <Field label="Quantity" htmlFor={`qty-${item.id}`}><Input id={`qty-${item.id}`} type="number" min={1} max={10000} step={1} value={item.quantity || ""} onChange={(e) => update(item.id, { quantity: Number(e.target.value) })} required /></Field>
        <Field label="Item status" htmlFor={`status-${item.id}`}><Select id={`status-${item.id}`} value={item.status} onChange={(e) => update(item.id, { status: e.target.value })}>{orderStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select></Field>
        <Field label="Item details" htmlFor={`notes-${item.id}`}><Input id={`notes-${item.id}`} value={item.notes} onChange={(e) => update(item.id, { notes: e.target.value })} maxLength={1000} /></Field>
      </div>
      <Button type="button" size="sm" variant="ghost" className="mt-3" onClick={() => onChange(items.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4" aria-hidden="true" />Remove item {index + 1}</Button>
    </fieldset>)}
    {!items.length && <p className="text-sm text-muted">Add each piece separately to track its progress.</p>}
    <Button type="button" variant="outline" size="sm" disabled={items.length >= 100} onClick={() => onChange([...items, { id: crypto.randomUUID(), name: "", quantity: 1, status: "pending", notes: "" }])}><Plus className="h-4 w-4" aria-hidden="true" />Add item</Button>
  </div>;
}
