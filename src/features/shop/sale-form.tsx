"use client";
import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { shopSaleInputSchema } from "@/features/shop/shop.schema";
import { manualSalePrice } from "@/lib/accounting-core";
import { today } from "@/lib/cms-core";
import { formatPkr, parseAmount } from "@/lib/money";
import { postJson } from "@/lib/submit";

const DEFAULT_MARGIN = "40";

/**
 * Manual pricing, for stock sold without an invoice. An invoice drafts its own
 * rows straight into the ledger, where only the purchase price is needed.
 */
export function SaleForm() {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [cost, setCost] = useState("");
  const [margin, setMargin] = useState(DEFAULT_MARGIN);
  const [discount, setDiscount] = useState("0");
  const [quantity, setQuantity] = useState("1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // The same function the server stores with, shown before saving so the
  // counter can read the price out loud while the customer waits.
  const costValue = parseAmount(cost);
  const marginValue = Number(margin);
  const discountValue = Number(discount);
  const qtyValue = Number(quantity);
  const valid = costValue !== null
    && Number.isInteger(marginValue) && marginValue >= 0 && marginValue <= 1000
    && Number.isInteger(discountValue) && discountValue >= 0 && discountValue <= 100
    && Number.isInteger(qtyValue) && qtyValue >= 1 && qtyValue <= 10000;
  const preview = valid ? manualSalePrice(costValue, marginValue, discountValue) : null;
  const lineProfit = preview && costValue !== null
    ? (preview.salePrice - BigInt(costValue)) * BigInt(qtyValue)
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
    setCost(""); setMargin(DEFAULT_MARGIN); setDiscount("0"); setQuantity("1");
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
        <Field label="Purchase price (Rs)" htmlFor="saleCost" hint="What the shop paid, per unit.">
          <Input id="saleCost" name="cost" inputMode="numeric" value={cost} onChange={(event) => setCost(event.target.value)} placeholder="10000" required />
        </Field>
        <Field label="Profit margin (%)" htmlFor="marginPct" hint={preview ? `Marked price ${formatPkr(preview.marked)}` : "Usually 40."}>
          <Input id="marginPct" name="marginPct" type="number" min={0} max={1000} step={1} value={margin} onChange={(event) => setMargin(event.target.value)} required />
        </Field>
        <Field label="Discount (%)" htmlFor="discountPct" hint={preview && preview.discount > 0n ? `Less ${formatPkr(preview.discount)}` : "Percent off the marked price."}>
          <Input id="discountPct" name="discountPct" type="number" min={0} max={100} step={1} value={discount} onChange={(event) => setDiscount(event.target.value)} required />
        </Field>
        <Field label="Quantity" htmlFor="saleQty">
          <Input id="saleQty" name="quantity" type="number" min={1} max={10000} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        </Field>
        <Field label="Note" htmlFor="saleNote" className="lg:col-span-2">
          <Input id="saleNote" name="note" maxLength={400} placeholder="Optional" />
        </Field>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-hairline pt-4 text-sm">
        <div><dt className="text-muted">Marked price</dt><dd className="mt-1 font-semibold tabular-nums">{preview ? formatPkr(preview.marked) : "—"}</dd></div>
        <div><dt className="text-muted">Sale price</dt><dd className="mt-1 font-semibold tabular-nums">{preview ? formatPkr(preview.salePrice) : "—"}</dd></div>
        <div><dt className="text-muted">Profit{qtyValue > 1 ? ` (× ${qtyValue})` : ""}</dt><dd className="mt-1 font-bold tabular-nums text-accent">{lineProfit !== null ? formatPkr(lineProfit) : "—"}</dd></div>
      </dl>

      {error && <p role="alert" className="mt-4 text-sm font-medium text-accent-deep">{error}</p>}

      <Button type="submit" size="lg" className="mt-4 w-full sm:w-auto" disabled={saving}>
        {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        {saving ? "Adding" : "Add sale"}
      </Button>
    </form>
  );
}
