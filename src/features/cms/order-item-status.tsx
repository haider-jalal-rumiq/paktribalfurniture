"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TriangleAlert } from "lucide-react";

import { Select } from "@/components/ui/field";
import { orderStatuses } from "@/content/cms";
import { submitRequest } from "@/lib/submit";

const patch = (orderId: string, body: unknown) => submitRequest(
  `/api/cms/orders/${orderId}`,
  { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
  "The change could not be saved.",
);

/**
 * Tick a piece off without opening its order. The list is where progress is
 * actually read, so it is also where it should be changed.
 */
export function OrderItemStatus({ orderId, itemId, status }: { orderId: string; itemId: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function change(next: string) {
    const previous = value;
    setValue(next);
    setSaving(true);
    setError("");
    const result = await patch(orderId, { itemId, status: next });
    setSaving(false);
    if (!result.ok) { setValue(previous); setError(result.message); return; }
    router.refresh();
  }

  return (
    <div className="print:hidden">
      <Select
        aria-label="Item status"
        value={value}
        disabled={saving}
        onChange={(event) => change(event.target.value)}
        className="min-w-36 px-2 py-1.5 text-sm"
      >
        {orderStatuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
      {error && <p role="alert" className="mt-1 text-xs text-accent-deep">{error}</p>}
    </div>
  );
}

/**
 * Urgency is the order's, not the item's — a piece cannot be urgent on its own.
 * Kept beside the order it belongs to so the distinction stays visible.
 */
export function OrderUrgentToggle({ orderId, urgent }: { orderId: string; urgent: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const result = await patch(orderId, { urgent: !urgent });
    setSaving(false);
    if (result.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      aria-pressed={urgent}
      className={`mt-1 inline-flex min-h-8 items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold transition-colors print:hidden ${
        urgent ? "bg-accent/12 text-accent-deep" : "text-muted hover:bg-wash"
      }`}
    >
      <TriangleAlert className="h-3 w-3" aria-hidden="true" />
      {urgent ? "Urgent" : "Mark urgent"}
    </button>
  );
}
