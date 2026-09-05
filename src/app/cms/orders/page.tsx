import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";

import { CmsPage } from "@/components/cms/cms-page";
import { RecordList } from "@/components/cms/record-list";
import { Badge, STATUS_TONE } from "@/components/ui/badge";
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

  const filters: { value?: string; label: string }[] = [
    { value: undefined, label: "All" },
    ...orderStatuses.map((s) => ({ value: s.value as string, label: s.label })),
  ];

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
      {/* Scrolls sideways on a phone rather than wrapping into three ragged rows. */}
      <nav
        aria-label="Filter by status"
        className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {filters.map((filter) => (
          <Link
            key={filter.label}
            href={filter.value ? `/cms/orders?status=${filter.value}` : "/cms/orders"}
            aria-current={active === filter.value ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center rounded-[var(--radius-pill)] border px-4 text-sm font-semibold transition-colors",
              active === filter.value
                ? "border-accent bg-accent text-white"
                : "border-hairline bg-surface text-ink-soft hover:border-ink hover:text-ink",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <RecordList
        emptyIcon={<ClipboardList className="h-8 w-8" aria-hidden="true" />}
        empty={active ? "No orders with that status." : "No orders yet. Add the first one."}
        rows={orders.map((order) => {
          const { balance } = orderBalance(order);
          const days = order.expected_date ? daysUntil(order.expected_date) : null;
          const overdue =
            days !== null && days < 0 && order.status !== "delivered" && order.status !== "cancelled";

          return {
            id: order.id,
            href: `/cms/orders/${order.id}`,
            title: order.title,
            subtitle: (
              <>
                #{order.order_no}
                {order.clients?.name ? ` · ${order.clients.name}` : ""}
                {order.site_label ? ` · ${order.site_label}` : ""}
              </>
            ),
            meta: (
              <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>
                {orderStatusLabel(order.status)}
              </Badge>
            ),
            metaSub: (
              <span className={cn("tabular-nums", overdue && "font-semibold text-accent")}>
                {balance > 0 ? `${formatPkr(balance)} due` : "Paid in full"}
                {overdue ? ` · ${Math.abs(days)}d late` : ""}
              </span>
            ),
          };
        })}
      />
    </CmsPage>
  );
}
