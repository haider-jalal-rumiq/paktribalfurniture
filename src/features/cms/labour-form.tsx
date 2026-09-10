"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormSection, StickyActions } from "@/components/cms/cms-page";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { labourInputSchema } from "@/features/cms/accounting.schema";
import { labourTotals } from "@/lib/accounting-core";
import { currentMonth, today } from "@/lib/cms-core";
import { formatPkr, parseAmount } from "@/lib/money";
import { submitRequest } from "@/lib/submit";
import type { LabourEntry } from "@/types/database";

/** Every money input is a controlled string so the payslip can total live. */
const money = (value: number | undefined, fallback = "0") => (value === undefined ? fallback : String(value));

export function LabourForm({ entry, month }: { entry?: LabourEntry; month?: string }) {
  const router = useRouter(), requestId = useRef(entry?.id ?? "");
  const [salary, setSalary] = useState(money(entry?.salary, ""));
  const [perDay, setPerDay] = useState(money(entry?.per_day_salary));
  const [leaves, setLeaves] = useState(money(entry?.leaves));
  const [otHours, setOtHours] = useState(money(entry?.ot_hours));
  const [otRate, setOtRate] = useState(money(entry?.ot_rate));
  const [deduction, setDeduction] = useState(money(entry?.deduction));
  const [advance, setAdvance] = useState(money(entry?.advance));
  const [paid, setPaid] = useState(money(entry?.salary_paid));
  const [saving, setSaving] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState("");

  const amounts = [salary, perDay, otRate, deduction, advance, paid].map(parseAmount);
  const counts = [leaves, otHours].map(Number);
  const ready = amounts.every((value) => value !== null) && counts.every((value) => Number.isInteger(value) && value >= 0);
  // The same function the server stores with, so the number below the fields is
  // exactly the number that will be saved.
  const totals = ready
    ? labourTotals({
        salary: amounts[0]!, per_day_salary: amounts[1]!, ot_rate: amounts[2]!, deduction: amounts[3]!,
        advance: amounts[4]!, salary_paid: amounts[5]!, leaves: counts[0], ot_hours: counts[1],
      })
    : null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); requestId.current ||= crypto.randomUUID();
    const parsed = labourInputSchema.safeParse({ ...Object.fromEntries(new FormData(event.currentTarget)), id: requestId.current });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the labour entry."); return; }
    setSaving(true);
    const result = await submitRequest(entry ? `/api/cms/labour/${entry.id}` : "/api/cms/labour", { method: entry ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
    if (!result.ok) { setError(result.message); setSaving(false); return; }
    setSaved(true); router.push(`/factory/expenses/labour?month=${parsed.data.period}`); router.refresh();
  }

  const line = (label: string, value: string, tone = "text-ink") => (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={`break-all font-semibold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );

  return <form onSubmit={submit} className="space-y-4">
    <FormSection title="Worker and period">
      <Field label="Worker name" htmlFor="labourName"><Input id="labourName" name="name" maxLength={140} defaultValue={entry?.name} required /></Field>
      <Field label="Salary month" htmlFor="period"><Input id="period" name="period" type="month" defaultValue={entry?.period.slice(0, 7) ?? month ?? currentMonth()} required /></Field>
      <Field label="Payment date" htmlFor="labourPaidOn" hint="The date used in the monthly expense summary."><Input id="labourPaidOn" name="paidOn" type="date" defaultValue={entry?.paid_on ?? today()} required /></Field>
    </FormSection>

    <FormSection title="Earnings" hint="Overtime is hours times the hourly rate.">
      <Field label="Monthly salary (Rs)" htmlFor="salary">
        <Input id="salary" name="salary" inputMode="numeric" value={salary} onChange={(e) => setSalary(e.target.value)} required />
      </Field>
      <Field label="Per-day salary (Rs)" htmlFor="perDaySalary" hint="Used to price a leave day.">
        <Input id="perDaySalary" name="perDaySalary" inputMode="numeric" value={perDay} onChange={(e) => setPerDay(e.target.value)} required />
      </Field>
      <Field label="Overtime hours" htmlFor="otHours">
        <Input id="otHours" name="otHours" type="number" min={0} max={1000} step={1} value={otHours} onChange={(e) => setOtHours(e.target.value)} required />
      </Field>
      <Field label="Overtime rate per hour (Rs)" htmlFor="otRate" hint={totals ? `Overtime ${formatPkr(totals.overtime)}` : undefined}>
        <Input id="otRate" name="otRate" inputMode="numeric" value={otRate} onChange={(e) => setOtRate(e.target.value)} required />
      </Field>
    </FormSection>

    <FormSection title="Deductions">
      <Field label="Leaves (days)" htmlFor="leaves" hint={totals ? `Leave deduction ${formatPkr(totals.leaveDeduction)}` : "Priced at the per-day salary."}>
        <Input id="leaves" name="leaves" type="number" min={0} max={31} step={1} value={leaves} onChange={(e) => setLeaves(e.target.value)} required />
      </Field>
      <Field label="Other deduction (Rs)" htmlFor="deduction" hint="Fines, damages, advances taken elsewhere.">
        <Input id="deduction" name="deduction" inputMode="numeric" value={deduction} onChange={(e) => setDeduction(e.target.value)} required />
      </Field>
    </FormSection>

    <FormSection title="Payments">
      <Field label="Advance paid (Rs)" htmlFor="advance"><Input id="advance" name="advance" inputMode="numeric" value={advance} onChange={(e) => setAdvance(e.target.value)} required /></Field>
      <Field label="Salary paid, excluding advance (Rs)" htmlFor="salaryPaid"><Input id="salaryPaid" name="salaryPaid" inputMode="numeric" value={paid} onChange={(e) => setPaid(e.target.value)} required /></Field>
      <Field label="Notes" htmlFor="labourNotes" className="sm:col-span-2"><Textarea id="labourNotes" name="notes" maxLength={1000} defaultValue={entry?.notes ?? ""} /></Field>
    </FormSection>

    <section className="rounded-[var(--radius-card)] border border-hairline bg-canvas-deep p-4 sm:p-5">
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Payslip</h3>
      {totals ? (
        <dl className="mt-3 space-y-2 text-sm">
          {line("Salary", formatPkr(amounts[0]!))}
          {line("Overtime", `+ ${formatPkr(totals.overtime)}`)}
          {line(`Leave deduction (${counts[0]} × ${formatPkr(amounts[1]!)})`, `− ${formatPkr(totals.leaveDeduction)}`)}
          {line("Other deduction", `− ${formatPkr(amounts[3]!)}`)}
          <div className="border-t border-hairline pt-2">{line("Total payable", formatPkr(totals.total), "text-accent")}</div>
          {line("Advance + salary paid", `− ${formatPkr(totals.paid)}`)}
          <div className="border-t border-hairline pt-2">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="font-semibold text-ink-soft">Balance remaining</dt>
              <dd className="break-all font-display text-2xl tabular-nums text-accent">{formatPkr(totals.balance)}</dd>
            </div>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-sm text-muted">Fill in the amounts above to see the payslip.</p>
      )}
      <p className="mt-3 text-xs text-muted">
        Advance and salary paid count as expenses and reduce Credit. Do not add the same payment again as a general expense.
      </p>
    </section>

    {error && <p role="alert" className="text-sm text-accent-deep">{error}</p>}
    <StickyActions><Button type="submit" disabled={saving || saved}>{saved ? "Saved — opening" : saving ? "Saving…" : "Save labour entry"}</Button></StickyActions>
  </form>;
}
