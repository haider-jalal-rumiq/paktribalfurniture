"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { shopSaleCostSchema } from "@/features/shop/shop.schema";
import { submitRequest } from "@/lib/submit";

/**
 * The one field a draft row needs. Kept inline in the ledger rather than on its
 * own screen: the sale price and quantity are already billed, so there is
 * nothing else to fill in and no reason to navigate away.
 */
export function SaleCostForm({ id, saleNo, cost }: { id: string; saleNo: number; cost: number | null }) {
  const router = useRouter();
  const [value, setValue] = useState(cost === null ? "" : String(cost));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = shopSaleCostSchema.safeParse({ cost: value });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the price."); return; }

    setSaving(true);
    const result = await submitRequest(`/api/shop/sales/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    }, "The purchase price could not be saved.");
    setSaving(false);
    if (!result.ok) { setError(result.message); return; }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="print:hidden">
      <div className="flex items-center gap-1.5">
        <Input
          aria-label={`Purchase price for sale ${saleNo}`}
          inputMode="numeric"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Cost"
          className="w-24 px-2 py-1.5 text-sm tabular-nums"
        />
        <Button type="submit" size="sm" variant="outline" disabled={saving}>
          {saving ? "…" : cost === null ? "Add" : "Save"}
        </Button>
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-accent-deep">{error}</p>}
    </form>
  );
}
