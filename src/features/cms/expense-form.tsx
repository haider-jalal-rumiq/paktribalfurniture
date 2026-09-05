"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { expenseCategories } from "@/content/cms";
import { expenseInputSchema } from "@/features/cms/expense.schema";
import { today } from "@/lib/cms-core";
import { formatPkr, parseAmount } from "@/lib/money";
import { postJson, submitRequest } from "@/lib/submit";

export function ExpenseForm({ openOrders }: { openOrders: { id: string; label: string }[] }) {
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

    const checked = expenseInputSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!checked.success) {
      setError(checked.error.issues[0]?.message ?? "Check the expense details.");
      setSaving(false);
      return;
    }

    const result = await postJson(
      "/api/cms/expenses",
      checked.data,
      "The expense could not be saved.",
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
    <form ref={formRef} onSubmit={submit} className="border border-hairline bg-surface p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Amount (Rs)" htmlFor="amount" hint={parsed ? formatPkr(parsed) : undefined}>
          <Input
            id="amount"
            name="amount"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="5000"
            required
          />
        </Field>
        <Field label="Category" htmlFor="category">
          <Select id="category" name="category" defaultValue="material" required>
            {expenseCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" htmlFor="spentOn">
          <Input id="spentOn" name="spentOn" type="date" defaultValue={today()} required />
        </Field>
        <Field label="Note" htmlFor="note">
          <Input id="note" name="note" placeholder="Optional" />
        </Field>
        <Field label="Against order" htmlFor="orderId" hint="Optional job costing">
          <Select id="orderId" name="orderId" defaultValue="">
            <option value="">Not linked</option>
            {openOrders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-accent-deep">
          {error}
        </p>
      )}

      <Button type="submit" className="mt-4" disabled={saving}>
        {saving ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Plus className="h-4 w-4" aria-hidden="true" />
        )}
        {saving ? "Adding" : "Add expense"}
      </Button>
    </form>
  );
}

export function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm("Remove this expense?")) return;
    setBusy(true);
    const result = await submitRequest(
      `/api/cms/expenses/${expenseId}`,
      { method: "DELETE" },
      "The expense could not be removed.",
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
