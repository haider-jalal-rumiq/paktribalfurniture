"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { paymentMethods } from "@/content/cms";
import { paymentInputSchema } from "@/features/cms/payment.schema";
import { today } from "@/lib/cms-core";
import { formatPkr, parseAmount } from "@/lib/money";
import { postJson, submitRequest } from "@/lib/submit";

export function PaymentForm({ orderId, balance }: { orderId: string; balance: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const parsed = parseAmount(amount);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const checked = paymentInputSchema.safeParse(Object.fromEntries(form));
    if (!checked.success) {
      setError(checked.error.issues[0]?.message ?? "Check the payment details.");
      setSaving(false);
      return;
    }

    const result = await postJson(
      `/api/cms/orders/${orderId}/payments`,
      checked.data,
      "The payment could not be saved.",
    );

    if (!result.ok) {
      setError(result.message);
      setSaving(false);
      return;
    }

    formRef.current?.reset();
    setAmount("");
    setSaving(false);
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={submit} className="rounded-[var(--radius-card)] border border-hairline bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          label="Amount received (Rs)"
          htmlFor="amount"
          hint={parsed ? formatPkr(parsed) : balance > 0 ? `${formatPkr(balance)} outstanding` : undefined}
        >
          <Input
            id="amount"
            name="amount"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="100000"
            required
          />
        </Field>
        <Field label="Date" htmlFor="paidOn">
          <Input id="paidOn" name="paidOn" type="date" defaultValue={today()} required />
        </Field>
        <Field label="Method" htmlFor="method">
          <Select id="method" name="method" defaultValue="cash" required>
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Note" htmlFor="note">
          <Input id="note" name="note" placeholder="Optional" />
        </Field>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-accent-deep">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-4 w-full sm:w-auto" disabled={saving}>
        {saving ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Plus className="h-4 w-4" aria-hidden="true" />
        )}
        {saving ? "Recording" : "Record payment"}
      </Button>
    </form>
  );
}

export function DeletePaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm("Remove this payment?")) return;
    setBusy(true);
    const result = await submitRequest(
      `/api/cms/payments/${paymentId}`,
      { method: "DELETE" },
      "The payment could not be removed.",
    );
    setBusy(false);
    if (result.ok) router.refresh();
    else window.alert(result.message);
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className="min-h-11 text-xs font-semibold text-muted hover:text-accent-deep disabled:opacity-50"
    >
      {busy ? "Removing" : "Remove"}
    </button>
  );
}
