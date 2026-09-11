import { ExpenseTabs } from "@/components/cms/expense-tabs";
import { CmsPage } from "@/components/cms/cms-page";
import { RecordList } from "@/components/cms/record-list";
import { StatCard } from "@/components/cms/stat-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { labourTotals } from "@/lib/accounting-core";
import { getLabourEntries, getLabourMonths } from "@/lib/cms";
import { currentMonth, monthLabel } from "@/lib/cms-core";
import { formatPkr } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata = { title: "Labour sheet" };
export const dynamic = "force-dynamic";

export default async function LabourPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const requestedMonth = (await searchParams).month;
  const month = /^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(requestedMonth ?? "") ? requestedMonth! : currentMonth();
  const [entries, months] = await Promise.all([getLabourEntries(month), getLabourMonths()]);
  const rows = entries.map((entry) => ({ entry, totals: labourTotals(entry) }));
  const total = rows.reduce((sum, row) => sum + row.totals.total, 0n);
  const paid = rows.reduce((sum, row) => sum + row.totals.paid, 0n);

  // The month being viewed is always offered, even before it has any entries.
  const pickable = [...new Set([month, ...months])].sort().reverse();

  return <CmsPage title="Labour sheet" eyebrow="Expenses" actions={<><ButtonLink href={`/factory/expenses/labour/new?month=${month}`} size="sm">Add labour entry</ButtonLink>{entries.length > 0 && <ButtonLink href={`/factory/expenses/labour/print?month=${month}`} size="sm" variant="outline">Print / PDF</ButtonLink>}</>}>
    <ExpenseTabs active="labour" />

    {/* One tap per month that has entries. The date input stays for any other
        month, including ones not yet started. */}
    <nav aria-label="Salary month" className="mb-4 flex flex-wrap gap-2">
      {pickable.map((value) => (
        <ButtonLink
          key={value}
          href={`/factory/expenses/labour?month=${value}`}
          size="sm"
          variant={value === month ? "primary" : "outline"}
          aria-current={value === month ? "page" : undefined}
        >
          {monthLabel(value)}
        </ButtonLink>
      ))}
    </nav>

    <form action="/factory/expenses/labour" className="mb-6 flex items-end gap-3">
      <Field label="Another month" htmlFor="salaryMonth">
        <Input id="salaryMonth" name="month" type="month" defaultValue={month} required />
      </Field>
      <Button type="submit" variant="outline">Show</Button>
    </form>

    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      <StatCard label="Total amount" value={formatPkr(total)} />
      <StatCard label="Paid incl. advance" value={formatPkr(paid)} />
      <StatCard label="Balance remaining" value={formatPkr(total - paid)} tone="accent" />
    </div>

    <p className="mb-4 text-sm text-muted">
      {monthLabel(month)} · {entries.length} {entries.length === 1 ? "worker" : "workers"}. Open a name to see and edit the payslip.
    </p>

    {/* Names only. The full breakdown lives on the worker's own page — a grid of
        six figures per worker made the month unreadable at a glance. */}
    <RecordList
      empty="No labour entries for this month. Add a worker to begin."
      rows={rows.map(({ entry, totals }) => ({
        id: entry.id,
        href: `/factory/expenses/labour/${entry.id}`,
        title: entry.name,
        meta: (
          <span className={cn("font-semibold tabular-nums", totals.balance > 0n ? "text-accent" : "text-ink")}>
            {formatPkr(totals.balance)}
          </span>
        ),
        metaSub: totals.balance > 0n ? "still owing" : "settled",
      }))}
    />

    {!entries.length && pickable.length > 1 && (
      <p className="mt-4 text-sm text-muted">Pick another month above to see its workers.</p>
    )}
  </CmsPage>;
}
