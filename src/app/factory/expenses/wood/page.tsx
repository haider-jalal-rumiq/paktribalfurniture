import { ExpenseTabs } from "@/components/cms/expense-tabs";
import { CmsPage, SectionHeading } from "@/components/cms/cms-page";
import { RecordList } from "@/components/cms/record-list";
import { StatCard } from "@/components/cms/stat-card";
import { WoodAccountList } from "@/components/cms/wood-account-list";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { woodTotals } from "@/lib/accounting-core";
import { getAllWoodEntries, getWoodEntries, getWoodMonths } from "@/lib/cms";
import { currentMonth, monthLabel } from "@/lib/cms-core";
import { formatPkr } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata = { title: "Wood sheet" };
export const dynamic = "force-dynamic";

export default async function WoodPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const requestedMonth = (await searchParams).month;
  const month = /^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(requestedMonth ?? "") ? requestedMonth! : currentMonth();
  const [entries, allEntries, months] = await Promise.all([getWoodEntries(month), getAllWoodEntries(), getWoodMonths()]);
  const monthly = woodTotals(entries);
  const overall = woodTotals(allEntries);
  const pickable = [...new Set([month, ...months])].sort().reverse();

  return <CmsPage title="Wood sheet" eyebrow="Expenses" actions={<ButtonLink href={`/factory/expenses/wood/new?month=${month}&mode=purchase`} size="sm">Add wood purchase</ButtonLink>}>
    <ExpenseTabs active="wood" />

    <nav aria-label="Wood purchase month" className="mb-4 flex flex-wrap gap-2">
      {pickable.map((value) => <ButtonLink key={value} href={`/factory/expenses/wood?month=${value}`} size="sm" variant={value === month ? "primary" : "outline"} aria-current={value === month ? "page" : undefined}>{monthLabel(value)}</ButtonLink>)}
    </nav>

    <form action="/factory/expenses/wood" className="mb-6 flex items-end gap-3">
      <Field label="Another month" htmlFor="woodMonth"><Input id="woodMonth" name="month" type="month" defaultValue={month} required /></Field>
      <Button type="submit" variant="outline">Show</Button>
    </form>

    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Purchased this month" value={formatPkr(monthly.purchased)} />
      <StatCard label="Paid this month" value={formatPkr(monthly.paid)} hint="Included in general expenses by payment date" />
      <StatCard label="Total wood purchased" value={formatPkr(overall.purchased)} />
      <StatCard label="Total remaining" value={formatPkr(overall.remaining)} tone="accent" />
    </div>

    <section className="mt-9">
      <SectionHeading>Purchaser accounts · all time</SectionHeading>
      <p className="mb-4 text-sm text-muted">Open a purchaser to see every purchase and payment, or to record the next transaction.</p>
      <WoodAccountList entries={allEntries} month={month} />
    </section>

    <section className="mt-9">
      <SectionHeading>{monthLabel(month)} transactions</SectionHeading>
      <p className="mb-4 text-sm text-muted">{entries.length} {entries.length === 1 ? "entry" : "entries"}. Open an entry to edit or remove it.</p>
      <RecordList
        empty="No wood purchases or payments for this month."
        rows={entries.map((entry) => {
          const totals = woodTotals([entry]);
          return {
            id: entry.id,
            href: `/factory/expenses/wood/${entry.id}`,
            title: entry.purchaser_name,
            subtitle: `Purchased ${formatPkr(totals.purchased)} · Paid ${formatPkr(totals.paid)}${entry.notes ? ` · ${entry.notes}` : ""}`,
            meta: <span className={cn("font-semibold tabular-nums", totals.remaining !== 0n ? "text-accent" : "text-ink")}>{totals.remaining < 0n ? `− ${formatPkr(-totals.remaining)}` : formatPkr(totals.remaining)}</span>,
            metaSub: totals.remaining > 0n ? "balance added" : totals.remaining < 0n ? "balance paid" : "settled",
          };
        })}
      />
    </section>
  </CmsPage>;
}
