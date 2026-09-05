import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Plus } from "lucide-react";

import { CmsPage, EmptyState, NotConfigured } from "@/components/cms/cms-page";
import { StatCard } from "@/components/cms/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { expenseCategoryLabel } from "@/content/cms";
import {
  currentMonth,
  daysUntil,
  getDueSoon,
  getExpenses,
  getOutstanding,
  monthLabel,
  orderBalance,
  summariseExpenses,
} from "@/lib/cms";
import { formatPkr, formatPkrShort } from "@/lib/money";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata = { title: "Dashboard" };

function dueLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export default async function CmsDashboardPage() {
  const configured = hasSupabaseEnv();
  const month = currentMonth();

  const [dueSoon, totals, expenses] = configured
    ? await Promise.all([getDueSoon(7), getOutstanding(), getExpenses(month)])
    : [[], { billed: 0, received: 0, outstanding: 0, openOrders: 0 }, []];

  const spend = summariseExpenses(expenses);
  const topCategories = Object.entries(spend.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <CmsPage
      eyebrow="Pak Tribal Furniture"
      title="Dashboard"
      actions={
        <ButtonLink href="/cms/orders/new" size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New order
        </ButtonLink>
      }
    >
      {!configured && <NotConfigured />}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open orders" value={totals.openOrders} />
        <StatCard
          label="Outstanding"
          value={formatPkrShort(totals.outstanding)}
          tone="accent"
          hint={`${formatPkr(totals.received)} received of ${formatPkr(totals.billed)}`}
        />
        <StatCard label={`Spend · ${monthLabel(month)}`} value={formatPkrShort(spend.total)} />
        <StatCard label="Due this week" value={dueSoon.length} />
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-3xl text-ink">Due soon</h2>
          <Link href="/cms/orders" className="text-sm font-semibold text-accent">
            All orders
          </Link>
        </div>

        {dueSoon.length ? (
          <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
            {dueSoon.map((order) => {
              const days = order.expected_date ? daysUntil(order.expected_date) : 0;
              const { balance } = orderBalance(order);
              return (
                <li key={order.id}>
                  <Link
                    href={`/cms/orders/${order.id}`}
                    className="flex min-h-16 items-center gap-3 py-4 transition-colors hover:bg-wash sm:px-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">
                        #{order.order_no} · {order.title}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted">
                        {order.clients?.name ?? "Unknown client"}
                        {order.site_label ? ` · ${order.site_label}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`flex items-center justify-end gap-1 text-sm font-semibold ${days < 0 ? "text-accent-deep" : days <= 2 ? "text-accent" : "text-ink-soft"}`}
                      >
                        {days <= 2 && <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
                        {dueLabel(days)}
                      </p>
                      {balance > 0 && (
                        <p className="mt-1 text-xs text-muted">{formatPkr(balance)} due</p>
                      )}
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState>Nothing due in the next seven days.</EmptyState>
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-3xl text-ink">{monthLabel(month)} spend</h2>
          <Link href="/cms/expenses" className="text-sm font-semibold text-accent">
            All expenses
          </Link>
        </div>

        {topCategories.length ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {topCategories.map(([category, amount]) => (
              <div key={category} className="border border-hairline bg-surface p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {expenseCategoryLabel(category)}
                </dt>
                <dd className="mt-2 text-lg font-semibold text-ink">{formatPkr(amount)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="mt-4">
            <EmptyState>No expenses recorded this month yet.</EmptyState>
          </div>
        )}
      </section>
    </CmsPage>
  );
}
