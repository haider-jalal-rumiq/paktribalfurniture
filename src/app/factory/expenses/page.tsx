import Link from "next/link";
import { CmsPage, EmptyState, SectionHeading } from "@/components/cms/cms-page";
import { ExpenseTabs } from "@/components/cms/expense-tabs";
import { StatCard } from "@/components/cms/stat-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { expenseCategoryLabel, labourExpenseLabel } from "@/content/cms";
import { ExpenseForm } from "@/features/cms/expense-form";
import { RecordAction } from "@/features/cms/record-action";
import { currentMonth, getExpenses, getLabourEntries, monthLabel } from "@/lib/cms";
import { labourTotals, showDate, sumRupees } from "@/lib/accounting-core";
import { formatPkr } from "@/lib/money";
export const metadata = { title: "Expenses" };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: requested } = await searchParams;
  const month = requested && /^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(requested) ? requested : currentMonth();
  const [expenses, labour] = await Promise.all([getExpenses(month), getLabourEntries(month, true)]);
  const general = sumRupees(expenses);
  const labourPaid = labour.reduce((sum, row) => sum + labourTotals(row).paid, 0n);
  const categories = new Map<string, bigint>();
  for (const row of expenses) categories.set(row.category, (categories.get(row.category) ?? 0n) + BigInt(row.amount));
  return <CmsPage title="Expenses" eyebrow="Workshop">
    <ExpenseTabs active="general" />
    <form action="/factory/expenses" className="mb-6 flex items-end gap-3"><Field label="Expense month" htmlFor="expenseMonth"><Input id="expenseMonth" name="month" type="month" defaultValue={month} required /></Field><Button type="submit" variant="outline">Show</Button></form>
    <div className="grid gap-3 sm:grid-cols-3"><StatCard label="Total expenses" value={formatPkr(general + labourPaid)} tone="accent" /><StatCard label="General expenses" value={formatPkr(general)} /><StatCard label={labourExpenseLabel} value={formatPkr(labourPaid)} hint="Advance + salary paid, by payment date" /></div>
    <section className="mt-8"><SectionHeading>Add an expense</SectionHeading><ExpenseForm /></section>
    {categories.size > 0 && <section className="mt-9"><SectionHeading>By category</SectionHeading><dl className="divide-y divide-hairline rounded-[var(--radius-card)] border border-hairline">{[...categories].map(([category, amount]) => <div key={category} className="flex flex-wrap justify-between gap-3 p-4 text-sm"><dt className="break-words text-ink-soft">{expenseCategoryLabel(category)}</dt><dd className="font-semibold tabular-nums">{formatPkr(amount)}</dd></div>)}</dl></section>}
    <section className="mt-9"><SectionHeading>{monthLabel(month)} entries</SectionHeading>
      {expenses.length ? <ul className="divide-y divide-hairline rounded-[var(--radius-card)] border border-hairline">{expenses.map((row) => <li key={row.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="break-all font-semibold tabular-nums">{formatPkr(row.amount)}</p><p className="mt-1 break-words text-sm text-muted">{expenseCategoryLabel(row.category)} · {showDate(row.spent_on)}{row.note ? ` · ${row.note}` : ""}</p></div><RecordAction url={`/api/cms/expenses/${row.id}`} confirmation="Remove this expense? The amount will be added back to available Credit." /></li>)}</ul> : <EmptyState>No general expenses for this month.</EmptyState>}
      {labour.length > 0 && <p className="mt-5 text-sm text-muted">{labour.length} labour entries paid this month. <Link href="/factory/expenses/labour" className="font-semibold text-accent">Open labour sheet</Link></p>}
    </section>
  </CmsPage>;
}
