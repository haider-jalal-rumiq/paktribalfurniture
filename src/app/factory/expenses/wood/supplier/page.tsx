import { notFound } from "next/navigation";

import { CmsPage, SectionHeading } from "@/components/cms/cms-page";
import { RecordList } from "@/components/cms/record-list";
import { StatCard } from "@/components/cms/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { showDate, woodAccountKey, woodAccounts } from "@/lib/accounting-core";
import { getAllWoodEntries } from "@/lib/cms";
import { currentMonth, monthLabel } from "@/lib/cms-core";
import { formatPkr } from "@/lib/money";
import { newWoodEntryHref } from "@/lib/wood-links";

export const metadata = { title: "Wood supplier" };

export default async function WoodSupplierPage({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  const name = (await searchParams).name?.trim() ?? "";
  const account = name ? woodAccounts(await getAllWoodEntries()).find((row) => row.id === woodAccountKey(name)) : undefined;
  if (!account) notFound();

  const month = currentMonth();
  const orders = account.entries.filter((entry) => entry.purchased_amount > 0).sort((a, b) => b.period.localeCompare(a.period));
  const payments = account.entries.filter((entry) => entry.paid_amount > 0).sort((a, b) => b.paid_on.localeCompare(a.paid_on));
  const balanceHint = account.remaining > 0n ? "Owed to this supplier" : account.remaining < 0n ? "Supplier credit" : "Settled";

  return <CmsPage
    eyebrow="Wood supplier"
    title={account.name}
    backHref="/factory/expenses/wood"
    actions={<>
      <ButtonLink href={newWoodEntryHref({ month, purchaser: account.name, mode: "purchase" })} size="sm">Add purchase</ButtonLink>
      <ButtonLink href={newWoodEntryHref({ month, purchaser: account.name, mode: "payment" })} size="sm" variant="outline">Record payment</ButtonLink>
    </>}
  >
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard label="Ordered" value={formatPkr(account.purchased)} hint={`${orders.length} ${orders.length === 1 ? "order" : "orders"}`} />
      <StatCard label="Paid" value={formatPkr(account.paid)} hint={`${payments.length} ${payments.length === 1 ? "payment" : "payments"}`} />
      <StatCard label="Remaining" value={formatPkr(account.remaining)} hint={balanceHint} tone={account.remaining > 0n ? "accent" : "neutral"} />
    </div>

    <section className="mt-9">
      <SectionHeading>Orders</SectionHeading>
      <p className="mb-4 text-sm text-muted">Every wood purchase from this supplier. Open an order to edit it.</p>
      <RecordList
        empty="No orders from this supplier yet."
        rows={orders.map((entry) => ({
          id: entry.id,
          href: `/factory/expenses/wood/${entry.id}`,
          title: `Purchase for ${monthLabel(entry.period.slice(0, 7))}`,
          subtitle: entry.notes ?? undefined,
          meta: <span className="font-semibold tabular-nums">{formatPkr(entry.purchased_amount)}</span>,
        }))}
      />
    </section>

    <section className="mt-9">
      <SectionHeading>Payments</SectionHeading>
      <p className="mb-4 text-sm text-muted">Money paid to this supplier. Each payment reduces the remaining balance.</p>
      <RecordList
        empty="No payments to this supplier yet."
        rows={payments.map((entry) => ({
          id: entry.id,
          href: `/factory/expenses/wood/${entry.id}`,
          title: `Payment on ${showDate(entry.paid_on)}`,
          subtitle: entry.notes ?? undefined,
          meta: <span className="font-semibold tabular-nums text-accent-deep">− {formatPkr(entry.paid_amount)}</span>,
        }))}
      />
    </section>
  </CmsPage>;
}
