import Link from "next/link";
import { Wallet } from "lucide-react";

import { CmsPage, EmptyState, SectionHeading } from "@/components/cms/cms-page";
import { StatCard } from "@/components/cms/stat-card";
import { RecordAction } from "@/features/cms/record-action";
import { ShopExpenseForm } from "@/features/shop/shop-expense-form";
import { showDate, sumRupees } from "@/lib/accounting-core";
import { getShopExpenses } from "@/lib/cms";
import { formatPkr } from "@/lib/money";

export const metadata = { title: "Shop expenses" };

export default async function ShopExpensesPage() {
  const expenses = await getShopExpenses();
  const total = sumRupees(expenses);

  const categories = new Map<string, bigint>();
  for (const row of expenses) categories.set(row.category, (categories.get(row.category) ?? 0n) + BigInt(row.amount));

  return (
    <CmsPage title="Expenses" eyebrow="Pak Tribal Furniture">
      <p className="mb-5 max-w-2xl text-sm text-muted">
        The shop&apos;s own costs — rent, labour, transport, anything spent running the showroom.
        These are the expenses <Link href="/shop" className="font-semibold text-accent">Calculate expense</Link> deducts
        from gross profit. The factory&apos;s expenses are kept separately in the CMS and are not counted here.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total expenses" value={formatPkr(total)} tone="accent" icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Entries" value={expenses.length} />
        <StatCard label="Categories" value={categories.size} />
      </div>

      <section className="mt-9">
        <SectionHeading>Add an expense</SectionHeading>
        <ShopExpenseForm />
      </section>

      {categories.size > 0 && (
        <section className="mt-9">
          <SectionHeading>By category</SectionHeading>
          <dl className="divide-y divide-hairline rounded-[var(--radius-card)] border border-hairline">
            {[...categories].map(([category, amount]) => (
              <div key={category} className="flex flex-wrap justify-between gap-3 p-4 text-sm">
                <dt className="break-words text-ink-soft">{category}</dt>
                <dd className="font-semibold tabular-nums">{formatPkr(amount)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="mt-9">
        <SectionHeading>All entries</SectionHeading>
        {expenses.length ? (
          <ul className="divide-y divide-hairline rounded-[var(--radius-card)] border border-hairline">
            {expenses.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="break-all font-semibold tabular-nums">{formatPkr(row.amount)}</p>
                  <p className="mt-1 break-words text-sm text-muted">
                    {row.category} · {showDate(row.spent_on)}{row.note ? ` · ${row.note}` : ""}
                  </p>
                </div>
                <RecordAction
                  url={`/api/shop/expenses/${row.id}`}
                  confirmation="Remove this expense? Shop net profit will increase by this amount."
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Wallet className="h-8 w-8" aria-hidden="true" />}>
            No shop expenses recorded yet.
          </EmptyState>
        )}
      </section>
    </CmsPage>
  );
}
