import Link from "next/link";
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";

import { Card, CmsPage, EmptyState, SectionHeading } from "@/components/cms/cms-page";
import { StatCard } from "@/components/cms/stat-card";
import { expenseCategories, expenseCategoryLabel } from "@/content/cms";
import { DeleteExpenseButton, ExpenseForm } from "@/features/cms/expense-form";
import {
  currentMonth,
  getExpenses,
  getOrders,
  monthLabel,
  shiftMonth,
  summariseExpenses,
} from "@/lib/cms";
import { formatPkr } from "@/lib/money";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata = { title: "Expenses" };

const dayFormatter = new Intl.DateTimeFormat("en-PK", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const VALID_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: requested } = await searchParams;
  const month = requested && VALID_MONTH.test(requested) ? requested : currentMonth();

  const [expenses, orders] = hasSupabaseEnv()
    ? await Promise.all([getExpenses(month), getOrders()])
    : [[], []];

  const { total, byCategory } = summariseExpenses(expenses);
  const used = expenseCategories.filter((c) => byCategory[c.value]);
  const biggest = Math.max(1, ...Object.values(byCategory));

  const openOrders = orders
    .filter((order) => order.status !== "delivered" && order.status !== "cancelled")
    .map((order) => ({ id: order.id, label: `#${order.order_no} · ${order.title}` }));

  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const canGoForward = month < currentMonth();

  return (
    <CmsPage eyebrow="Workshop" title="Expenses">
      {/* Month switcher reads as one control rather than two loose links. */}
      <div className="flex items-stretch overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)]">
        <Link
          href={`/cms/expenses?month=${prev}`}
          aria-label={`Go to ${monthLabel(prev)}`}
          className="flex min-h-12 w-12 shrink-0 items-center justify-center border-r border-hairline text-ink-soft transition-colors hover:bg-wash/60 hover:text-accent"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <p className="flex min-h-12 flex-1 items-center justify-center text-sm font-bold uppercase tracking-[0.14em] text-ink">
          {monthLabel(month)}
        </p>
        {canGoForward ? (
          <Link
            href={`/cms/expenses?month=${next}`}
            aria-label={`Go to ${monthLabel(next)}`}
            className="flex min-h-12 w-12 shrink-0 items-center justify-center border-l border-hairline text-ink-soft transition-colors hover:bg-wash/60 hover:text-accent"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <span className="flex w-12 shrink-0 items-center justify-center border-l border-hairline text-hairline">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label="Total spend" value={formatPkr(total)} tone="accent" emphasis />
        <StatCard
          label="Entries"
          value={expenses.length}
          hint={used.length ? `${used.length} categories` : undefined}
        />
      </div>

      <section className="mt-8">
        <SectionHeading>Add an expense</SectionHeading>
        <ExpenseForm openOrders={openOrders} />
      </section>

      {used.length > 0 && (
        <section className="mt-9">
          <SectionHeading>By category</SectionHeading>
          <Card className="p-4 sm:p-5">
            <dl className="space-y-3.5">
              {used
                .slice()
                .sort((a, b) => (byCategory[b.value] ?? 0) - (byCategory[a.value] ?? 0))
                .map((category) => {
                  const amount = byCategory[category.value] ?? 0;
                  return (
                    <div key={category.value}>
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-sm font-semibold text-ink-soft">{category.label}</dt>
                        <dd className="text-sm font-semibold tabular-nums text-ink">
                          {formatPkr(amount)}
                        </dd>
                      </div>
                      <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-wash">
                        <span
                          className="block h-full rounded-full bg-status-info"
                          style={{ width: `${Math.round((amount / biggest) * 100)}%` }}
                        />
                      </span>
                    </div>
                  );
                })}
            </dl>
          </Card>
        </section>
      )}

      <section className="mt-9">
        <SectionHeading>{monthLabel(month)} entries</SectionHeading>
        {expenses.length ? (
          <ul className="divide-y divide-hairline overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)]">
            {expenses.map((expense) => (
              <li key={expense.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-11 shrink-0 flex-col items-center justify-center rounded-[var(--radius-ui)] bg-wash text-[0.65rem] font-bold uppercase leading-tight text-ink-soft">
                  {dayFormatter.format(new Date(`${expense.spent_on}T00:00:00Z`)).split(" ")[0]}
                  <span className="font-semibold text-muted">
                    {dayFormatter.format(new Date(`${expense.spent_on}T00:00:00Z`)).split(" ")[1]}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold tabular-nums text-ink">{formatPkr(expense.amount)}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {expenseCategoryLabel(expense.category)}
                    {expense.note ? ` · ${expense.note}` : ""}
                  </p>
                </div>
                <DeleteExpenseButton expenseId={expense.id} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Wallet className="h-8 w-8" aria-hidden="true" />}>
            No expenses recorded for {monthLabel(month)}.
          </EmptyState>
        )}
      </section>
    </CmsPage>
  );
}
