import Link from "next/link";
import { Calculator, ReceiptText, Store } from "lucide-react";

import { CmsPage, EmptyState, NotConfigured, SectionHeading } from "@/components/cms/cms-page";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { partnerShares } from "@/content/cms";
import { RecordAction } from "@/features/cms/record-action";
import { SaleCostForm } from "@/features/shop/sale-cost-form";
import { SaleForm } from "@/features/shop/sale-form";
import { achievedMarginPct, partnerSplit, shopSaleAmounts, shopTotals, showDate, sumRupees } from "@/lib/accounting-core";
import { getShopExpenses, getShopSales } from "@/lib/cms";
import { formatPkr } from "@/lib/money";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata = { title: "Shop sales" };

/**
 * Three figures at a glance. One card split by dividers, because three separate
 * cards squeezed into a 375px row read as clutter rather than as a comparison.
 */
function SummaryStrip({ items }: { items: { label: string; value: string; hint: string }[] }) {
  return (
    <div className="grid grid-cols-3 divide-x divide-hairline overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)]">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 px-2.5 py-4 text-center sm:px-4 sm:py-5">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-muted sm:text-[0.7rem] sm:tracking-[0.14em]">
            {item.label}
          </p>
          <p className="mt-1.5 break-words font-display text-[1.05rem] leading-tight tabular-nums text-ink sm:text-[1.7rem]">
            {item.value}
          </p>
          <p className="mt-1 text-[0.62rem] leading-4 text-muted sm:text-xs">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ expenses?: string }> }) {
  const configured = hasSupabaseEnv();
  const [{ expenses: expenseParam }, sales, shopExpenses] = await Promise.all([
    searchParams,
    getShopSales(),
    getShopExpenses(),
  ]);

  // Deducting expenses is a deliberate act, so it lives in the URL rather than
  // in component state — the owner can bookmark or reload the net figure.
  const deducting = expenseParam === "1";
  const totals = shopTotals(sales);
  const expenses = sumRupees(shopExpenses);
  const net = deducting ? totals.profit - expenses : totals.profit;
  const { minor, major } = partnerSplit(net, BigInt(partnerShares.minor));

  // Derived once, then drawn twice: cards on a phone, a table from `sm` up.
  const rows = sales.map((sale) => ({
    sale,
    amounts: shopSaleAmounts(sale),
    returned: Boolean(sale.returned_on),
  }));

  const actionsFor = (id: string, returned: boolean) => (
    <>
      <RecordAction
        url={`/api/shop/sales/${id}`}
        method="PATCH"
        body={{ returned: !returned }}
        label={returned ? "Undo return" : "Returned"}
        confirmation={returned
          ? "Put this item back into sales and profit?"
          : "Mark this item returned to the shop? Its sale and profit come out of the totals."}
      />
      <RecordAction url={`/api/shop/sales/${id}`} confirmation="Delete this sale from the ledger? This cannot be undone." />
    </>
  );

  return (
    <CmsPage
      eyebrow="Pak Tribal Furniture"
      title="Shop sales"
      actions={<ButtonLink href="/shop/invoices/new" size="sm"><ReceiptText className="h-4 w-4" aria-hidden="true" />New invoice</ButtonLink>}
    >
      {!configured && <div className="mb-6"><NotConfigured /></div>}

      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">All-time totals</p>
      <SummaryStrip
        items={[
          { label: "Sales", value: formatPkr(totals.sales), hint: `${totals.sold} sold` },
          { label: "Gross profit", value: formatPkr(totals.profit), hint: totals.drafts ? `${totals.drafts} awaiting cost` : "after cost" },
          { label: "Returns", value: formatPkr(totals.returnedSales), hint: `${totals.returned} returned` },
        ]}
      />

      {totals.drafts > 0 && (
        <p className="mt-3 rounded-[var(--radius-card)] border border-accent/30 bg-accent/8 px-4 py-3 text-sm text-accent-deep">
          {totals.drafts} {totals.drafts === 1 ? "row is" : "rows are"} still missing a purchase price, so
          {totals.drafts === 1 ? " its" : " their"} profit is not counted yet. Add the cost in the ledger below.
        </p>
      )}

      {/* Reads top to bottom as the sum it is: expenses, then net, then the split. */}
      <section className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-canvas-deep px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">Expenses to deduct</p>
            <p className="mt-1 break-words font-semibold tabular-nums text-ink">{formatPkr(expenses)}</p>
            <p className="mt-0.5 text-xs leading-4 text-muted">
              The shop&apos;s own expenses · <Link href="/shop/expenses" className="font-semibold text-accent">manage</Link>
            </p>
          </div>
          {deducting ? (
            <ButtonLink href="/shop" size="sm" variant="outline" className="w-full sm:w-auto">Show gross profit</ButtonLink>
          ) : (
            <form action="/shop" className="w-full sm:w-auto">
              <input type="hidden" name="expenses" value="1" />
              <Button type="submit" size="sm" className="w-full sm:w-auto">
                <Calculator className="h-4 w-4" aria-hidden="true" />Calculate expense
              </Button>
            </form>
          )}
        </div>

        <div className="px-4 py-5 text-center">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
            {deducting ? "Net profit" : "Gross profit"}
          </p>
          <p className="mt-1.5 break-words font-display text-[2.1rem] leading-none tabular-nums text-accent sm:text-[2.6rem]">
            {formatPkr(net)}
          </p>
          <p className="mt-2 text-xs text-muted">
            {deducting ? "Gross profit less shop expenses" : "Expenses not deducted yet"}
          </p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-hairline border-t border-hairline">
          {[
            { label: `Partner ${partnerShares.minor}%`, value: minor },
            { label: `Partner ${partnerShares.major}%`, value: major },
          ].map((partner) => (
            <div key={partner.label} className="min-w-0 px-3 py-4 text-center">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted sm:text-[0.7rem]">{partner.label}</p>
              <p className="mt-1.5 break-words font-display text-[1.3rem] leading-tight tabular-nums text-ink sm:text-[1.7rem]">
                {formatPkr(partner.value)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-9">
        <SectionHeading>Add a sale</SectionHeading>
        <p className="mb-3 text-sm text-muted">
          For stock sold without an invoice. An invoice drafts its own rows into the ledger.
        </p>
        <SaleForm />
      </section>

      <section className="mt-9">
        <SectionHeading action={<Link href="/shop/invoices" className="text-sm font-semibold text-accent">Invoices</Link>}>Ledger</SectionHeading>

        {rows.length ? (
          <>
            {/* Phone: one card per sale. A ten-row labelled stack per item is
                complete but unreadable; this leads with the two figures that
                matter and keeps the working on one line. */}
            <ul className="space-y-3 sm:hidden">
              {rows.map(({ sale, amounts, returned }) => (
                <li key={sale.id} className="rounded-[var(--radius-card)] border border-hairline bg-surface p-4 shadow-[var(--shadow-card)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold leading-snug text-ink">
                        <span className="text-muted tabular-nums">#{sale.sale_no}</span> {sale.name}
                        {sale.quantity > 1 && <span className="text-sm font-normal text-muted"> × {sale.quantity}</span>}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {showDate(sale.sold_on)}{sale.note ? ` · ${sale.note}` : ""}
                      </p>
                    </div>
                    <p className={`shrink-0 text-right font-semibold tabular-nums ${returned ? "text-muted line-through" : "text-ink"}`}>
                      {formatPkr(amounts.sale)}
                    </p>
                  </div>

                  <p className="mt-2.5 text-xs tabular-nums text-muted">
                    {formatPkr(amounts.unit)} each
                    {sale.margin_pct !== null ? ` · +${sale.margin_pct}%` : ""}
                    {sale.discount_pct ? ` · less ${sale.discount_pct}%` : ""}
                    {amounts.cost !== null ? ` · cost ${formatPkr(amounts.cost)}` : ""}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3">
                    {amounts.profit === null ? (
                      <SaleCostForm id={sale.id} saleNo={sale.sale_no} cost={sale.cost} />
                    ) : (
                      <p className="text-sm">
                        <span className="text-muted">Profit </span>
                        <span className={`font-bold tabular-nums ${returned ? "text-muted line-through" : "text-accent"}`}>
                          {formatPkr(amounts.profit)}
                        </span>
                        {achievedMarginPct(amounts.sale, amounts.cost) !== null && (
                          <span className="text-muted"> · {achievedMarginPct(amounts.sale, amounts.cost)}%</span>
                        )}
                      </p>
                    )}
                    {returned && <Badge tone="warn">Returned {showDate(sale.returned_on!)}</Badge>}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-1">{actionsFor(sale.id, returned)}</div>
                </li>
              ))}
            </ul>

            {/* Tablet and up: the full ledger, every column visible. */}
            <div className="hidden overflow-x-auto rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)] sm:block">
              <table className="document-table">
                <caption className="sr-only">Every shop sale. All amounts are in Pakistani rupees.</caption>
                <thead>
                  <tr>
                    <th scope="col" aria-label="Serial number">S.No.</th>
                    <th scope="col">Stock</th>
                    <th scope="col" className="number">Qty</th>
                    <th scope="col" className="number">Unit</th>
                    <th scope="col" className="number">Sale</th>
                    <th scope="col" className="number">Cost</th>
                    <th scope="col" className="number">Profit</th>
                    <th scope="col" className="number">Margin</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ sale, amounts, returned }) => {
                    const margin = achievedMarginPct(amounts.sale, amounts.cost);
                    return (
                      <tr key={sale.id}>
                        <td className="tabular-nums">{sale.sale_no}</td>
                        <td>
                          <span className="font-semibold">{sale.name}</span>
                          <p className="mt-1 text-xs text-muted">
                            {showDate(sale.sold_on)}
                            {sale.margin_pct !== null ? ` · +${sale.margin_pct}%` : ""}
                            {sale.discount_pct ? ` · less ${sale.discount_pct}%` : ""}
                            {sale.note ? ` · ${sale.note}` : ""}
                          </p>
                          {returned && <p className="mt-1"><Badge tone="warn">Returned {showDate(sale.returned_on!)}</Badge></p>}
                        </td>
                        <td className="number">{sale.quantity}</td>
                        <td className="number">{formatPkr(amounts.unit)}</td>
                        <td className="number">{returned ? <s>{formatPkr(amounts.sale)}</s> : formatPkr(amounts.sale)}</td>
                        <td className="number">
                          {amounts.cost === null
                            ? <SaleCostForm id={sale.id} saleNo={sale.sale_no} cost={sale.cost} />
                            : formatPkr(amounts.cost)}
                        </td>
                        <td className="number font-semibold">
                          {amounts.profit === null
                            ? <span className="text-muted">Draft</span>
                            : returned ? <s>{formatPkr(amounts.profit)}</s> : formatPkr(amounts.profit)}
                        </td>
                        <td className="number">{margin === null ? "—" : `${margin}%`}</td>
                        <td><div className="flex flex-wrap gap-1">{actionsFor(sale.id, returned)}</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState icon={<Store className="h-8 w-8" aria-hidden="true" />}>
            No sales recorded yet. Save an invoice, or add a sale above.
          </EmptyState>
        )}
      </section>
    </CmsPage>
  );
}
