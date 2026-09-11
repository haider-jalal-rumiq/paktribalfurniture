import Link from "next/link";
import { ExpenseTabs } from "@/components/cms/expense-tabs";
import { CmsPage, EmptyState } from "@/components/cms/cms-page";
import { StatCard } from "@/components/cms/stat-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { labourPayBasisLabel } from "@/content/cms";
import { labourTotals, showDate } from "@/lib/accounting-core";
import { getLabourEntries } from "@/lib/cms";
import { currentMonth, monthLabel } from "@/lib/cms-core";
import { formatPkr } from "@/lib/money";

export const metadata = { title: "Labour sheet" };
export const dynamic = "force-dynamic";

export default async function LabourPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const requestedMonth = (await searchParams).month;
  const month = /^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(requestedMonth ?? "") ? requestedMonth! : currentMonth();
  const entries = await getLabourEntries(month);
  const rows = entries.map((entry) => ({ entry, totals: labourTotals(entry) }));
  const total = rows.reduce((sum, row) => sum + row.totals.total, 0n);
  const paid = rows.reduce((sum, row) => sum + row.totals.paid, 0n);

  return <CmsPage title="Labour sheet" eyebrow="Expenses" actions={<><ButtonLink href={`/factory/expenses/labour/new?month=${month}`} size="sm">Add labour entry</ButtonLink>{entries.length > 0 && <ButtonLink href={`/factory/expenses/labour/print?month=${month}`} size="sm" variant="outline">Print / PDF</ButtonLink>}</>}>
    <ExpenseTabs active="labour" />
    <form action="/factory/expenses/labour" className="mb-6 flex items-end gap-3"><Field label="Salary month" htmlFor="salaryMonth"><Input id="salaryMonth" name="month" type="month" defaultValue={month} required /></Field><Button type="submit" variant="outline">Show</Button></form>
    <div className="mb-6 grid gap-3 sm:grid-cols-3"><StatCard label="Total amount" value={formatPkr(total)} /><StatCard label="Paid incl. advance" value={formatPkr(paid)} /><StatCard label="Balance remaining" value={formatPkr(total - paid)} tone="accent" /></div>
    <p className="mb-4 text-sm text-muted">{monthLabel(month)} · {entries.length} entries. Open an entry to update its pay, overtime, deductions, or payments.</p>
    <div className="grid gap-4 lg:grid-cols-2">{rows.map(({ entry, totals }) => <Link key={entry.id} href={`/factory/expenses/labour/${entry.id}`} className="rounded-[var(--radius-card)] border border-hairline p-5 transition-colors hover:border-accent">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="break-words font-display text-xl">{entry.name}</h2>
        <span className="text-xs text-muted">{labourPayBasisLabel(entry.pay_basis)}{entry.ot_hours > 0 ? ` · ${entry.ot_hours} h OT` : ""}</span>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">{[
        { label: "Regular pay", amount: totals.regularPay },
        { label: "Overtime", amount: totals.overtime },
        { label: "Deductions", amount: totals.leaveDeduction + BigInt(entry.deduction) },
        { label: "Total payable", amount: totals.total },
        { label: "Paid", amount: totals.paid },
        { label: "Balance", amount: totals.balance },
      ].map((field) => <div key={field.label}><dt className="text-xs text-muted">{field.label}</dt><dd className="mt-1 break-all font-semibold tabular-nums">{formatPkr(field.amount)}</dd></div>)}</dl>
      <p className="mt-4 text-xs text-muted">Payment date: {showDate(entry.paid_on)}</p>
    </Link>)}</div>
    {!entries.length && <EmptyState>No labour entries for this month. Add a worker to begin.</EmptyState>}
  </CmsPage>;
}
