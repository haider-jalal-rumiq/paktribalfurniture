import Link from "next/link";
import { Plus } from "lucide-react";

import { CmsPage } from "@/components/cms/cms-page";
import { RecordList } from "@/components/cms/record-list";
import { ButtonLink } from "@/components/ui/button";
import { orderStatusLabel, orderStatuses } from "@/content/cms";
import { daysUntil, getOrders, orderBalance } from "@/lib/cms";
import { formatPkr } from "@/lib/money";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = orderStatuses.some((option) => option.value === status) ? status : undefined;
  const orders = hasSupabaseEnv() ? await getOrders({ status: active }) : [];

  const filters = [{ value: undefined, label: "All" }, ...orderStatuses.map((s) => ({ value: s.value as string | undefined, label: s.label }))];

  return (
    <CmsPage
      title="Orders"
      actions={
        <ButtonLink href="/cms/orders/new" size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New order
        </ButtonLink>
      }
    >
      <nav aria-label="Filter by status" className="mt-5 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.label}
            href={filter.value ? `/cms/orders?status=${filter.value}` : "/cms/orders"}
            aria-current={active === filter.value ? "page" : undefined}
            className={cn(
              "inline-flex min-h-9 items-center rounded-[var(--radius-ui)] border px-3 text-xs font-semibold transition-colors",
              active === filter.value
                ? "border-accent bg-accent text-white"
                : "border-hairline bg-surface text-ink-soft hover:border-ink",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        <RecordList
          empty={active ? "No orders with that status." : "No orders yet. Add the first one."}
          rows={orders.map((order) => {
            const { balance } = orderBalance(order);
            const days = order.expected_date ? daysUntil(order.expected_date) : null;
            return {
              id: order.id,
              href: `/cms/orders/${order.id}`,
              title: `#${order.order_no} · ${order.title}`,
              subtitle: [order.clients?.name, order.site_label].filter(Boolean).join(" · "),
              meta: orderStatusLabel(order.status),
              metaSub:
                balance > 0
                  ? `${formatPkr(balance)} due${days !== null && days < 0 ? ` · ${Math.abs(days)}d overdue` : ""}`
                  : "Paid in full",
            };
          })}
        />
      </div>
    </CmsPage>
  );
}
