import Link from "next/link";
import { Calculator, ReceiptText, RotateCcw, Store } from "lucide-react";

import { CmsPage, EmptyState, NotConfigured, SectionHeading } from "@/components/cms/cms-page";
import { StatCard } from "@/components/cms/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { partnerShares } from "@/content/cms";
import { RecordAction } from "@/features/cms/record-action";
import { SaleForm } from "@/features/shop/sale-form";
import { partnerSplit, shopSaleAmounts, shopTotals, showDate } from "@/lib/accounting-core";
import { getFinancialTotals, getShopSales } from "@/lib/cms";
import { formatPkr } from "@/lib/money";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata = { title: "Shop sales" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ expenses?: string }> }) {
  const configured = hasSupabaseEnv();
  const [{ expenses: expenseParam }, sales, cms] = await Promise.all([
    searchParams,
    getShopSales(),
    getFinancialTotals(),
  ]);

  // Deducting expenses is a deliberate act, so it lives in the URL rather than
  // in component state — the owner can bookmark or reload the net figure.
  const deducting = expenseParam === "1";
  const totals = shopTotals(sales);
  const expenses = cms?.expenses ?? 0n;
  const net = deducting ? totals.profit - expenses : totals.profit;
  const { minor, major } = partnerSplit(net, BigInt(partnerShares.minor));

  return (
    <CmsPage
      eyebrow="Pak Tribal Furniture"
      title="Shop sales"
      actions={<ButtonLink href="/shop/invoices/new" size="sm"><ReceiptText className="h-4 w-4" aria-hidden="true" />New invoice</ButtonLink>}
    >
      {!configured && <div className="mb-6"><NotConfigured /></div>}

      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">All-time totals</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total sales" value={formatPkr(totals.sales)} icon={<Store className="h-4 w-4" />} hint={`${totals.sold} items sold`} />
        <StatCard label="Gross profit" value={formatPkr(totals.profit)} tone="accent" hint="Sale price minus purchase price" />
        <StatCard label="Returns" value={formatPkr(totals.returnedSales)} icon={<RotateCcw className="h-4 w-4" />} hint={`${totals.returned} returned, already out of sales and profit`} />
        <StatCard label="Expenses" value={cms ? formatPkr(expenses) : "—"} hint="From the factory CMS: general expenses + paid labour" />
      </div>

      <section className="mt-8 rounded-[var(--radius-card)] border border-hairline bg-canvas-deep p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.4rem] leading-none text-ink sm:text-[1.65rem]">Partner shares</h2>
            <p className="mt-2 text-sm text-muted">
              {deducting
                ? `Net profit is gross profit less ${formatPkr(expenses)} of CMS expenses.`
                : "Currently on gross profit. Deduct expenses to see the real split."}
            </p>
          </div>
          {deducting ? (
            <ButtonLink href="/shop" size="sm" variant="outline">Show gross profit</ButtonLink>
          ) : (
            <form action="/shop">
              <input type="hidden" name="expenses" value="1" />
              <Button type="submit" size="sm" disabled={!cms}>
                <Calculator className="h-4 w-4" aria-hidden="true" />Calculate expense
              </Button>
            </form>
          )}
        </div>
        {configured && !cms && (
          <p role="alert" className="mt-3 text-sm text-accent-deep">
            Expenses could not be loaded from the CMS. Refresh before splitting profit.
          </p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatCard label={deducting ? "Net profit" : "Gross profit"} value={formatPkr(net)} tone="accent" emphasis />
          <StatCard label={`Partner share ${partnerShares.minor}%`} value={formatPkr(minor)} />
          <StatCard label={`Partner share ${partnerShares.major}%`} value={formatPkr(major)} />
        </div>
      </section>

      <section className="mt-9">
        <SectionHeading>Add a sale</SectionHeading>
        <SaleForm />
      </section>

      <section className="mt-9">
        <SectionHeading action={<Link href="/shop/invoices" className="text-sm font-semibold text-accent">Invoices</Link>}>Ledger</SectionHeading>
        {sales.length ? (
          // Wide by nature; `document-table` already collapses to labelled
          // blocks under 640px, so only the desktop layout can overflow.
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-hairline bg-surface px-4 py-2 shadow-[var(--shadow-card)] sm:px-0 sm:py-0">
          <table className="document-table">
            <caption className="sr-only">Every shop sale. All amounts are in Pakistani rupees.</caption>
            <thead>
              <tr>
                <th scope="col" aria-label="Serial number">S.No.</th>
                <th scope="col">Stock</th>
                <th scope="col" className="number">Price</th>
                <th scope="col" className="number">Margin</th>
                <th scope="col" className="number">Marked</th>
                <th scope="col" className="number">Discount</th>
                <th scope="col" className="number">Sale</th>
                <th scope="col" className="number">Profit</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((row) => {
                const amounts = shopSaleAmounts(row);
                const returned = Boolean(row.returned_on);
                return (
                  <tr key={row.id}>
                    <td data-label="S.No." className="tabular-nums">{row.sale_no}</td>
                    <td data-label="Stock">
                      <span className="font-semibold">{row.name}</span>
                      <p className="mt-1 text-xs text-muted">{showDate(row.sold_on)}{row.note ? ` · ${row.note}` : ""}</p>
                      {returned && <p className="mt-1"><Badge tone="warn">Returned {showDate(row.returned_on!)}</Badge></p>}
                    </td>
                    <td data-label="Price" className="number">{formatPkr(amounts.cost)}</td>
                    <td data-label="Margin" className="number">{row.margin_pct}%</td>
                    <td data-label="Marked" className="number">{formatPkr(amounts.marked)}</td>
                    <td data-label="Discount" className="number">{formatPkr(amounts.discount)}</td>
                    <td data-label="Sale" className="number">{returned ? <s>{formatPkr(amounts.sale)}</s> : formatPkr(amounts.sale)}</td>
                    <td data-label="Profit" className="number font-semibold">{returned ? <s>{formatPkr(amounts.profit)}</s> : formatPkr(amounts.profit)}</td>
                    <td data-label="Actions">
                      <div className="flex flex-wrap gap-1">
                        <RecordAction
                          url={`/api/shop/sales/${row.id}`}
                          method="PATCH"
                          body={{ returned: !returned }}
                          label={returned ? "Undo return" : "Returned"}
                          confirmation={returned
                            ? "Put this item back into sales and profit?"
                            : "Mark this item returned to the shop? Its sale and profit come out of the totals."}
                        />
                        <RecordAction url={`/api/shop/sales/${row.id}`} confirmation="Delete this sale from the ledger? This cannot be undone." />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        ) : (
          <EmptyState icon={<Store className="h-8 w-8" aria-hidden="true" />}>
            No sales recorded yet. Add the first one above.
          </EmptyState>
        )}
      </section>
    </CmsPage>
  );
}
