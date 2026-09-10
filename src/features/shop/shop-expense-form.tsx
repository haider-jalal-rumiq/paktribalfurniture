"use client";
import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { expenseInputSchema } from "@/features/cms/expense.schema";
import { today } from "@/lib/cms-core";
import { formatPkr, parseAmount } from "@/lib/money";
import { postJson } from "@/lib/submit";

/** Same fields and schema as a factory expense; only the endpoint differs. */
export function ShopExpenseForm() {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const parsed = parseAmount(amount);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const checked = expenseInputSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!checked.success) { setError(checked.error.issues[0]?.message ?? "Check the expense details."); return; }

    setSaving(true);
    const result = await postJson("/api/shop/expenses", checked.data, "The expense could not be saved.");
    setSaving(false);
    if (!result.ok) { setError(result.message); return; }

    form.current?.reset();
    setAmount("");
    router.refresh();
  }

  return (
    <form ref={form} onSubmit={submit} className="rounded-[var(--radius-card)] border border-hairline bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Amount (Rs)" htmlFor="shopExpenseAmount" hint={parsed ? formatPkr(parsed) : undefined}>
          <Input id="shopExpenseAmount" name="amount" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="5000" required />
        </Field>
        <Field label="Category" htmlFor="shopExpenseCategory">
          <Input id="shopExpenseCategory" name="category" maxLength={80} placeholder="Rent, labour, transport" required />
        </Field>
        <Field label="Date" htmlFor="shopExpenseDate">
          <Input id="shopExpenseDate" name="spentOn" type="date" defaultValue={today()} required />
        </Field>
        <Field label="Note" htmlFor="shopExpenseNote">
          <Input id="shopExpenseNote" name="note" placeholder="Optional" />
        </Field>
      </div>

      {error && <p role="alert" className="mt-4 text-sm font-medium text-accent-deep">{error}</p>}

      <Button type="submit" size="lg" className="mt-4 w-full sm:w-auto" disabled={saving}>
        {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        {saving ? "Adding" : "Add expense"}
      </Button>
    </form>
  );
}
