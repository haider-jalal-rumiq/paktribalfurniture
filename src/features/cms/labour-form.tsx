"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormSection, StickyActions } from "@/components/cms/cms-page";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { labourInputSchema } from "@/features/cms/accounting.schema";
import { currentMonth, today } from "@/lib/cms-core";
import { formatPkr, parseAmount } from "@/lib/money";
import { submitRequest } from "@/lib/submit";
import type { LabourEntry } from "@/types/database";

export function LabourForm({ entry, month }: { entry?: LabourEntry; month?: string }) {
  const router = useRouter(), requestId = useRef(entry?.id ?? "");
  const [total, setTotal] = useState(String(entry?.total_amount ?? ""));
  const [advance, setAdvance] = useState(String(entry?.advance ?? 0));
  const [paid, setPaid] = useState(String(entry?.salary_paid ?? 0));
  const [saving, setSaving] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState("");
  const figures = [total, advance, paid].map(parseAmount);
  const balance = figures.every((v) => v !== null) ? BigInt(figures[0]!) - BigInt(figures[1]!) - BigInt(figures[2]!) : null;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); requestId.current ||= crypto.randomUUID();
    const parsed = labourInputSchema.safeParse({ ...Object.fromEntries(new FormData(event.currentTarget)), id: requestId.current });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the labour entry."); return; }
    setSaving(true);
    const result = await submitRequest(entry ? `/api/cms/labour/${entry.id}` : "/api/cms/labour", { method: entry ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
    if (!result.ok) { setError(result.message); setSaving(false); return; }
    setSaved(true); router.push(`/cms/expenses/labour?month=${parsed.data.period}`); router.refresh();
  }
  return <form onSubmit={submit} className="space-y-4">
    <FormSection title="Worker and period">
      <Field label="Worker name" htmlFor="labourName"><Input id="labourName" name="name" maxLength={140} defaultValue={entry?.name} required /></Field>
      <Field label="Salary month" htmlFor="period"><Input id="period" name="period" type="month" defaultValue={entry?.period.slice(0, 7) ?? month ?? currentMonth()} required /></Field>
      <Field label="Leaves (days)" htmlFor="leaves"><Input id="leaves" name="leaves" type="number" min={0} max={31} step={1} defaultValue={entry?.leaves ?? 0} required /></Field>
      <Field label="Payment date" htmlFor="labourPaidOn" hint="The date used in the monthly expense summary."><Input id="labourPaidOn" name="paidOn" type="date" defaultValue={entry?.paid_on ?? today()} required /></Field>
    </FormSection>
    <FormSection title="Salary and balance" hint="Enter the agreed total after any adjustments. Leaves do not automatically deduct salary.">
      <Field label="Salary (Rs)" htmlFor="salary"><Input id="salary" name="salary" inputMode="numeric" defaultValue={entry?.salary ?? ""} required /></Field>
      <Field label="Total amount (Rs)" htmlFor="labourTotal"><Input id="labourTotal" name="totalAmount" inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} required /></Field>
      <Field label="Advance paid (Rs)" htmlFor="advance"><Input id="advance" name="advance" inputMode="numeric" value={advance} onChange={(e) => setAdvance(e.target.value)} required /></Field>
      <Field label="Salary paid, excluding advance (Rs)" htmlFor="salaryPaid"><Input id="salaryPaid" name="salaryPaid" inputMode="numeric" value={paid} onChange={(e) => setPaid(e.target.value)} required /></Field>
      <div className="sm:col-span-2"><p className="text-sm font-semibold text-ink-soft">Balance remaining</p><output className="mt-1 block break-all text-2xl tabular-nums text-accent">{balance !== null ? formatPkr(balance) : "Enter amounts"}</output><p className="mt-2 text-xs text-muted">Advance + salary paid count as expenses and reduce Credit. Do not add the same payment again as a general expense.</p></div>
      <Field label="Notes" htmlFor="labourNotes" className="sm:col-span-2"><Textarea id="labourNotes" name="notes" maxLength={1000} defaultValue={entry?.notes ?? ""} /></Field>
    </FormSection>
    {error && <p role="alert" className="text-sm text-accent-deep">{error}</p>}
    <StickyActions><Button type="submit" disabled={saving || saved}>{saved ? "Saved — opening" : saving ? "Saving…" : "Save labour entry"}</Button></StickyActions>
  </form>;
}
