import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { CmsPage } from "@/components/cms/cms-page";
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

const dateFormatter = new Intl.DateTimeFormat("en-PK", { day: "2-digit", month: "short", timeZone: "UTC" });

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

  const openOrders = orders
    .filter((order) => order.status !== "delivered" && order.status !== "cancelled")
    .map((order) => ({ id: order.id, label: `#${order.order_no} · ${order.title}` }));

  return (
    <CmsPage eyebrow={monthLabel(month)} title="Expenses">
      <nav aria-label="Change month" className="mt-5 flex items-center gap-2">
        <Link
          href={`/cms/expenses?month=${shiftMonth(month, -1)}`}
          className="inline-flex min-h-11 items-center gap-1 border border-hairline bg-surface px-3 text-sm font-semibold text-ink-soft hover:border-ink"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {monthLabel(shiftMonth(month, -1))}
        </Link>
        {month < currentMonth() && (
          <Link
            href={`/cms/expenses?month=${shiftMonth(month, 1)}`}
            className="inline-flex min-h-11 items-center gap-1 border border-hairline bg-surface px-3 text-sm font-semibold text-ink-soft hover:border-ink"
          >
            {monthLabel(shiftMonth(month, 1))}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </nav>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={`${monthLabel(month)} total`} value={formatPkr(total)} tone="accent" />
        <StatCard label="Entries" value={expenses.length} />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-3xl text-ink">Add an expense</h2>
        <div className="mt-4">
          <ExpenseForm openOrders={openOrders} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl text-ink">By category</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {expenseCategories.map((category) => (
            <div key={category.value} className="border border-hairline bg-surface p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {category.label}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-ink">
                {formatPkr(byCategory[category.value] ?? 0)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl text-ink">{monthLabel(month)} entries</h2>
        {expenses.length ? (
          <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
            {expenses.map((expense) => (
              <li key={expense.id} className="flex items-center gap-3 py-3 sm:px-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{formatPkr(expense.amount)}</p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {dateFormatter.format(new Date(`${expense.spent_on}T00:00:00Z`))} ·{" "}
                    {expenseCategoryLabel(expense.category)}
                    {expense.note ? ` · ${expense.note}` : ""}
                  </p>
                </div>
                <DeleteExpenseButton expenseId={expense.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 border border-hairline bg-surface p-6 text-sm text-muted">
            No expenses recorded for {monthLabel(month)}.
          </p>
        )}
      </section>
    </CmsPage>
  );
}
