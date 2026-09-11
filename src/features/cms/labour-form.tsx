"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormSection, StickyActions } from "@/components/cms/cms-page";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { labourPayBases, type LabourPayBasis } from "@/content/cms";
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
  const [payBasis, setPayBasis] = useState<LabourPayBasis>(entry?.pay_basis ?? "monthly");
  const [salary, setSalary] = useState(money(entry?.salary));
  const [perDay, setPerDay] = useState(money(entry?.per_day_salary));
  const [daysWorked, setDaysWorked] = useState(money(entry?.days_worked));
  const [itemCount, setItemCount] = useState(money(entry?.item_count));
  const [itemRate, setItemRate] = useState(money(entry?.item_rate));
  const [leaves, setLeaves] = useState(money(entry?.leaves));
  const [otHours, setOtHours] = useState(money(entry?.ot_hours));
  const [otRate, setOtRate] = useState(money(entry?.ot_rate));
  const [deduction, setDeduction] = useState(money(entry?.deduction));
  const [advance, setAdvance] = useState(money(entry?.advance));
  const [paid, setPaid] = useState(money(entry?.salary_paid));
  const [saving, setSaving] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState("");

  const salaryAmount = parseAmount(payBasis === "monthly" ? salary : "0");
  const perDayAmount = parseAmount(payBasis === "per_item" ? "0" : perDay);
  const itemRateAmount = parseAmount(payBasis === "per_item" ? itemRate : "0");
  const otRateAmount = parseAmount(otRate);
  const deductionAmount = parseAmount(deduction);
  const advanceAmount = parseAmount(advance);
  const paidAmount = parseAmount(paid);
  const activeDays = Number(payBasis === "daily" ? daysWorked : 0);
  const activeItems = Number(payBasis === "per_item" ? itemCount : 0);
  const activeLeaves = Number(payBasis === "monthly" ? leaves : 0);
  const overtimeHours = Number(otHours);
  const amounts = [salaryAmount, perDayAmount, itemRateAmount, otRateAmount, deductionAmount, advanceAmount, paidAmount];
  const counts = [activeDays, activeItems, activeLeaves, overtimeHours];
  const ready = amounts.every((value) => value !== null)
    && counts.every((value) => Number.isInteger(value) && value >= 0);
  // The same function the server stores with, so the number below the fields is
  // exactly the number that will be saved.
  const totals = ready
    ? labourTotals({
        pay_basis: payBasis,
        salary: salaryAmount!,
        per_day_salary: perDayAmount!,
        days_worked: activeDays,
        item_count: activeItems,
        item_rate: itemRateAmount!,
        ot_hours: overtimeHours,
        ot_rate: otRateAmount!,
        deduction: deductionAmount!,
        leaves: activeLeaves,
        advance: advanceAmount!,
        salary_paid: paidAmount!,
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

  const regularPayLabel = payBasis === "daily"
    ? `Days worked (${activeDays} × ${formatPkr(perDayAmount ?? 0)})`
    : payBasis === "per_item"
      ? `Items completed (${activeItems} × ${formatPkr(itemRateAmount ?? 0)})`
      : "Monthly salary";

  return <form onSubmit={submit} className="space-y-4">
    <FormSection title="Worker and period">
      <Field label="Worker name" htmlFor="labourName"><Input id="labourName" name="name" maxLength={140} defaultValue={entry?.name} required /></Field>
      <Field label="Salary month" htmlFor="period"><Input id="period" name="period" type="month" defaultValue={entry?.period.slice(0, 7) ?? month ?? currentMonth()} required /></Field>
      <Field label="Payment date" htmlFor="labourPaidOn" hint="The date used in the monthly expense summary."><Input id="labourPaidOn" name="paidOn" type="date" defaultValue={entry?.paid_on ?? today()} required /></Field>
    </FormSection>

    <FormSection title="Worker pay basis" hint="Choose how this worker's regular earnings are calculated.">
      <fieldset className="sm:col-span-2">
        <legend className="sr-only">Worker pay basis</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {labourPayBases.map((basis) => <label key={basis.value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-ui)] border px-4 py-3 text-sm font-semibold transition-colors ${payBasis === basis.value ? "border-accent bg-accent/8 text-accent-deep" : "border-hairline bg-surface text-ink-soft hover:border-accent"}`}>
            <input type="radio" name="payBasis" value={basis.value} checked={payBasis === basis.value} onChange={() => setPayBasis(basis.value)} className="h-4 w-4 accent-accent" />
            {basis.label}
          </label>)}
        </div>
      </fieldset>
    </FormSection>

    <FormSection title="Earnings" hint="Regular pay is calculated from the selected basis. Overtime is hours times the hourly rate.">
      {payBasis === "monthly" && <>
        <Field label="Monthly salary (Rs)" htmlFor="salary">
          <Input id="salary" name="salary" inputMode="numeric" value={salary} onChange={(event) => setSalary(event.target.value)} required />
        </Field>
        <Field label="Per-day salary (Rs)" htmlFor="perDaySalary" hint="Used to price a leave day.">
          <Input id="perDaySalary" name="perDaySalary" inputMode="numeric" value={perDay} onChange={(event) => setPerDay(event.target.value)} required />
        </Field>
        <Field label="Leaves (days)" htmlFor="leaves" hint={totals ? `Leave deduction ${formatPkr(totals.leaveDeduction)}` : "Priced at the per-day salary."}>
          <Input id="leaves" name="leaves" type="number" min={0} max={31} step={1} value={leaves} onChange={(event) => setLeaves(event.target.value)} required />
        </Field>
        <input type="hidden" name="daysWorked" value="0" /><input type="hidden" name="itemCount" value="0" /><input type="hidden" name="itemRate" value="0" />
      </>}
      {payBasis === "daily" && <>
        <Field label="No. of days worked" htmlFor="daysWorked">
          <Input id="daysWorked" name="daysWorked" type="number" min={0} max={31} step={1} value={daysWorked} onChange={(event) => setDaysWorked(event.target.value)} required />
        </Field>
        <Field label="Rate per day (Rs)" htmlFor="perDaySalary" hint={totals ? `Regular pay ${formatPkr(totals.regularPay)}` : undefined}>
          <Input id="perDaySalary" name="perDaySalary" inputMode="numeric" value={perDay} onChange={(event) => setPerDay(event.target.value)} required />
        </Field>
        <input type="hidden" name="salary" value="0" /><input type="hidden" name="leaves" value="0" /><input type="hidden" name="itemCount" value="0" /><input type="hidden" name="itemRate" value="0" />
      </>}
      {payBasis === "per_item" && <>
        <Field label="No. of items completed" htmlFor="itemCount">
          <Input id="itemCount" name="itemCount" type="number" min={0} max={1000000} step={1} value={itemCount} onChange={(event) => setItemCount(event.target.value)} required />
        </Field>
        <Field label="Rate per item (Rs)" htmlFor="itemRate" hint={totals ? `Regular pay ${formatPkr(totals.regularPay)}` : undefined}>
          <Input id="itemRate" name="itemRate" inputMode="numeric" value={itemRate} onChange={(event) => setItemRate(event.target.value)} required />
        </Field>
        <input type="hidden" name="salary" value="0" /><input type="hidden" name="perDaySalary" value="0" /><input type="hidden" name="leaves" value="0" /><input type="hidden" name="daysWorked" value="0" />
      </>}
      <Field label="No. of overtime hours" htmlFor="otHours">
        <Input id="otHours" name="otHours" type="number" min={0} max={1000} step={1} value={otHours} onChange={(event) => setOtHours(event.target.value)} required />
      </Field>
      <Field label="Rate per overtime hour (Rs)" htmlFor="otRate" hint={totals ? `Overtime ${formatPkr(totals.overtime)}` : undefined}>
        <Input id="otRate" name="otRate" inputMode="numeric" value={otRate} onChange={(event) => setOtRate(event.target.value)} required />
      </Field>
    </FormSection>

    <FormSection title="Deductions">
      <Field label="Other deduction (Rs)" htmlFor="deduction" hint="Fines, damages, advances taken elsewhere.">
        <Input id="deduction" name="deduction" inputMode="numeric" value={deduction} onChange={(event) => setDeduction(event.target.value)} required />
      </Field>
    </FormSection>

    <FormSection title="Payments">
      <Field label="Advance paid (Rs)" htmlFor="advance"><Input id="advance" name="advance" inputMode="numeric" value={advance} onChange={(event) => setAdvance(event.target.value)} required /></Field>
      <Field label="Amount paid, excluding advance (Rs)" htmlFor="salaryPaid"><Input id="salaryPaid" name="salaryPaid" inputMode="numeric" value={paid} onChange={(event) => setPaid(event.target.value)} required /></Field>
      <Field label="Notes" htmlFor="labourNotes" className="sm:col-span-2"><Textarea id="labourNotes" name="notes" maxLength={1000} defaultValue={entry?.notes ?? ""} /></Field>
    </FormSection>

    <section className="rounded-[var(--radius-card)] border border-hairline bg-canvas-deep p-4 sm:p-5">
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Payslip</h3>
      {totals ? (
        <dl className="mt-3 space-y-2 text-sm">
          {line(regularPayLabel, formatPkr(totals.regularPay))}
          {line("Overtime", `+ ${formatPkr(totals.overtime)}`)}
          {payBasis === "monthly" && line(`Leave deduction (${activeLeaves} × ${formatPkr(perDayAmount!)})`, `− ${formatPkr(totals.leaveDeduction)}`)}
          {line("Other deduction", `− ${formatPkr(deductionAmount!)}`)}
          <div className="border-t border-hairline pt-2">{line("Total payable", formatPkr(totals.total), "text-accent")}</div>
          {line("Advance + amount paid", `− ${formatPkr(totals.paid)}`)}
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
        Advance and amount paid count as expenses and reduce Credit. Do not add the same payment again as a general expense.
      </p>
    </section>

    {error && <p role="alert" className="text-sm text-accent-deep">{error}</p>}
    <StickyActions><Button type="submit" disabled={saving || saved}>{saved ? "Saved — opening" : saving ? "Saving…" : "Save labour entry"}</Button></StickyActions>
  </form>;
}
