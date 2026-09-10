import Link from "next/link";
import { CmsPage, EmptyState } from "@/components/cms/cms-page";
import { ExpenseTabs } from "@/components/cms/expense-tabs";
import { StatCard } from "@/components/cms/stat-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { currentMonth, getLabourEntries, monthLabel } from "@/lib/cms";
import { labourAmounts, showDate } from "@/lib/accounting-core";
import { formatPkr } from "@/lib/money";
export const metadata = { title: "Labour sheet" };
export default async function LabourPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: requested } = await searchParams;
  const month = requested && /^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(requested) ? requested : currentMonth();
  const entries = await getLabourEntries(month);
  const total = entries.reduce((sum, row) => sum + BigInt(row.total_amount), 0n);
  const paid = entries.reduce((sum, row) => sum + labourAmounts(row).paid, 0n);
  return <CmsPage title="Labour sheet" eyebrow="Expenses" actions={<><ButtonLink href={`/cms/expenses/labour/new?month=${month}`} size="sm">Add labour entry</ButtonLink>{entries.length > 0 && <ButtonLink href={`/cms/expenses/labour/print?month=${month}`} size="sm" variant="outline">Print / PDF</ButtonLink>}</>}>
    <ExpenseTabs active="labour" />
    <form action="/cms/expenses/labour" className="mb-6 flex items-end gap-3"><Field label="Salary month" htmlFor="salaryMonth"><Input id="salaryMonth" name="month" type="month" defaultValue={month} required /></Field><Button type="submit" variant="outline">Show</Button></form>
    <div className="mb-6 grid gap-3 sm:grid-cols-3"><StatCard label="Total amount" value={formatPkr(total)} /><StatCard label="Paid incl. advance" value={formatPkr(paid)} /><StatCard label="Balance remaining" value={formatPkr(total - paid)} tone="accent" /></div>
    <p className="mb-4 text-sm text-muted">{monthLabel(month)} · {entries.length} entries. Open an entry to update salary payments or leaves.</p>
    <div className="grid gap-4 lg:grid-cols-2">{entries.map((row) => <Link key={row.id} href={`/cms/expenses/labour/${row.id}`} className="rounded-[var(--radius-card)] border border-hairline p-5 transition-colors hover:border-accent"><div className="flex flex-wrap justify-between gap-3"><h2 className="break-words font-display text-xl">{row.name}</h2><span className="text-xs text-muted">{row.leaves} leave days</span></div><dl className="mt-5 grid grid-cols-2 gap-4 text-sm">{[{ label: "Salary", amount: BigInt(row.salary) }, { label: "Total amount", amount: BigInt(row.total_amount) }, { label: "Advance", amount: BigInt(row.advance) }, { label: "Salary paid", amount: BigInt(row.salary_paid) }, { label: "Balance", amount: labourAmounts(row).balance }].map((field) => <div key={field.label}><dt className="text-xs text-muted">{field.label}</dt><dd className="mt-1 break-all font-semibold tabular-nums">{formatPkr(field.amount)}</dd></div>)}</dl><p className="mt-4 text-xs text-muted">Payment date: {showDate(row.paid_on)}</p></Link>)}</div>
    {!entries.length && <EmptyState>No labour entries for this month. Add a worker to begin.</EmptyState>}
  </CmsPage>;
}
