"use client";
import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { shopSaleInputSchema } from "@/features/shop/shop.schema";
import { shopSaleAmounts } from "@/lib/accounting-core";
import { today } from "@/lib/cms-core";
import { formatPkr, parseAmount } from "@/lib/money";
import { postJson } from "@/lib/submit";

const DEFAULT_MARGIN = "40";

export function SaleForm() {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [cost, setCost] = useState("");
  const [margin, setMargin] = useState(DEFAULT_MARGIN);
  const [discount, setDiscount] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // The same formula the ledger and the database use, shown before saving so
  // the counter can read the sale price out loud while the customer waits.
  const costValue = parseAmount(cost);
  const discountValue = parseAmount(discount);
  const marginValue = Number(margin);
  const preview = costValue !== null && discountValue !== null && Number.isInteger(marginValue) && marginValue >= 0 && marginValue <= 1000
    ? shopSaleAmounts({ cost: costValue, margin_pct: marginValue, discount: discountValue })
    : null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = shopSaleInputSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the sale."); return; }

    setSaving(true);
    const result = await postJson("/api/shop/sales", parsed.data, "The sale could not be saved.");
    setSaving(false);
    if (!result.ok) { setError(result.message); return; }

    form.current?.reset();
    setCost(""); setMargin(DEFAULT_MARGIN); setDiscount("0");
    router.refresh();
  }

  return (
    <form ref={form} onSubmit={submit} className="rounded-[var(--radius-card)] border border-hairline bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Stock name" htmlFor="saleName" className="lg:col-span-2">
          <Input id="saleName" name="name" maxLength={200} placeholder="Table lamp" required />
        </Field>
        <Field label="Sale date" htmlFor="soldOn">
          <Input id="soldOn" name="soldOn" type="date" defaultValue={today()} required />
        </Field>
        <Field label="Purchase price (Rs)" htmlFor="saleCost" hint="What the shop paid for this item.">
          <Input id="saleCost" name="cost" inputMode="numeric" value={cost} onChange={(event) => setCost(event.target.value)} placeholder="10000" required />
        </Field>
        <Field label="Profit margin (%)" htmlFor="marginPct" hint={preview ? `Marked price ${formatPkr(preview.marked)}` : "Usually 40."}>
          <Input id="marginPct" name="marginPct" type="number" min={0} max={1000} step={1} value={margin} onChange={(event) => setMargin(event.target.value)} required />
        </Field>
        <Field label="Discount given (Rs)" htmlFor="saleDiscount" hint="Rupees off the marked price. Enter 0 for none.">
          <Input id="saleDiscount" name="discount" inputMode="numeric" value={discount} onChange={(event) => setDiscount(event.target.value)} required />
        </Field>
        <Field label="Note" htmlFor="saleNote" className="lg:col-span-3">
          <Input id="saleNote" name="note" maxLength={400} placeholder="Optional" />
        </Field>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-hairline pt-4 text-sm">
        <div><dt className="text-muted">Marked price</dt><dd className="mt-1 font-semibold tabular-nums">{preview ? formatPkr(preview.marked) : "—"}</dd></div>
        <div><dt className="text-muted">Sale</dt><dd className="mt-1 font-semibold tabular-nums">{preview ? formatPkr(preview.sale) : "—"}</dd></div>
        <div><dt className="text-muted">Profit</dt><dd className="mt-1 font-bold tabular-nums text-accent">{preview ? formatPkr(preview.profit) : "—"}</dd></div>
      </dl>

      {error && <p role="alert" className="mt-4 text-sm font-medium text-accent-deep">{error}</p>}

      <Button type="submit" size="lg" className="mt-4 w-full sm:w-auto" disabled={saving}>
        {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        {saving ? "Adding" : "Add sale"}
      </Button>
    </form>
  );
}
