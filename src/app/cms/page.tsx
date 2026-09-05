import Link from "next/link";
import { AlertTriangle, CalendarCheck, ClipboardList, Plus, Wallet } from "lucide-react";

import { Card, CmsPage, EmptyState, NotConfigured, SectionHeading } from "@/components/cms/cms-page";
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
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

function dueLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `In ${days} days`;
}

export default async function CmsDashboardPage() {
  const configured = hasSupabaseEnv();
  const month = currentMonth();

  const [dueSoon, totals, expenses] = configured
    ? await Promise.all([getDueSoon(7), getOutstanding(), getExpenses(month)])
    : [[], { billed: 0, received: 0, outstanding: 0, openOrders: 0 }, []];

  const spend = summariseExpenses(expenses);
  const topCategories = Object.entries(spend.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const overdue = dueSoon.filter((o) => o.expected_date && daysUntil(o.expected_date) < 0).length;
  const collected = totals.billed ? Math.round((totals.received / totals.billed) * 100) : 0;

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
      {!configured && (
        <div className="mb-6">
          <NotConfigured />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Outstanding"
          value={formatPkrShort(totals.outstanding)}
          tone="accent"
          emphasis
          icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
          className="col-span-2"
          hint={
            totals.billed > 0 ? (
              <span className="block">
                <span className="mb-1.5 mt-0.5 block h-1.5 w-full overflow-hidden rounded-full bg-accent/15">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${collected}%` }}
                  />
                </span>
                {formatPkr(totals.received)} received of {formatPkr(totals.billed)} · {collected}%
              </span>
            ) : (
              "No open orders billed yet"
            )
          }
        />
        <StatCard
          label="Open orders"
          value={totals.openOrders}
          icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
          hint={overdue ? `${overdue} overdue` : "Nothing overdue"}
        />
        <StatCard
          label={`${monthLabel(month)} spend`}
          value={formatPkrShort(spend.total)}
          icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
          hint={`${expenses.length} ${expenses.length === 1 ? "entry" : "entries"}`}
        />
      </div>

      <section className="mt-9">
        <SectionHeading
          action={
            <Link href="/cms/orders" className="text-sm font-semibold text-accent hover:underline">
              All orders
            </Link>
          }
        >
          Due soon
        </SectionHeading>

        {dueSoon.length ? (
          <ul className="divide-y divide-hairline overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)]">
            {dueSoon.map((order) => {
              const days = order.expected_date ? daysUntil(order.expected_date) : 0;
              const { balance } = orderBalance(order);
              const urgent = days <= 2;
              return (
                <li key={order.id}>
                  <Link
                    href={`/cms/orders/${order.id}`}
                    className="group flex min-h-[4.5rem] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-wash/50"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-10 w-1 shrink-0 rounded-full",
                        days < 0 ? "bg-accent" : urgent ? "bg-status-warn" : "bg-hairline",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold leading-snug text-ink">
                        {order.title}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        #{order.order_no} · {order.clients?.name ?? "Unknown client"}
                        {order.site_label ? ` · ${order.site_label}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-bold",
                          days < 0
                            ? "text-accent"
                            : urgent
                              ? "text-status-warn"
                              : "text-ink-soft",
                        )}
                      >
                        {days <= 2 && <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
                        {dueLabel(days)}
                      </span>
                      {balance > 0 && (
                        <span className="text-xs tabular-nums text-muted">
                          {formatPkr(balance)} due
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={<CalendarCheck className="h-8 w-8" aria-hidden="true" />}>
            Nothing due in the next seven days.
          </EmptyState>
        )}
      </section>

      <section className="mt-9">
        <SectionHeading
          action={
            <Link href="/cms/expenses" className="text-sm font-semibold text-accent hover:underline">
              All expenses
            </Link>
          }
        >
          {monthLabel(month)} spend
        </SectionHeading>

        {topCategories.length ? (
          <Card className="p-4 sm:p-5">
            <dl className="space-y-3.5">
              {topCategories.map(([category, amount]) => (
                <div key={category}>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-sm font-semibold text-ink-soft">
                      {expenseCategoryLabel(category)}
                    </dt>
                    <dd className="text-sm font-semibold tabular-nums text-ink">
                      {formatPkr(amount)}
                    </dd>
                  </div>
                  <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-wash">
                    <span
                      className="block h-full rounded-full bg-status-info"
                      style={{ width: `${Math.round((amount / spend.total) * 100)}%` }}
                    />
                  </span>
                </div>
              ))}
            </dl>
          </Card>
        ) : (
          <EmptyState icon={<Wallet className="h-8 w-8" aria-hidden="true" />}>
            No expenses recorded this month yet.
          </EmptyState>
        )}
      </section>

      {dueSoon.length > 0 && (
        <p className="mt-8 text-center text-xs text-muted">
          {dueSoon.filter((o) => o.status).length} of your open orders shown ·{" "}
          <Link href="/cms/orders" className="font-semibold text-accent">
            see every status
          </Link>
        </p>
      )}
    </CmsPage>
  );
}
