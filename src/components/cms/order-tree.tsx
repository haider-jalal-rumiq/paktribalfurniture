import Link from "next/link";
import { ChevronRight, ClipboardList, TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/cms/cms-page";
import { Badge, STATUS_TONE } from "@/components/ui/badge";
import { clientTypeShort, openOrderStatuses, orderStatusLabel } from "@/content/cms";
import type { OrderWithClient } from "@/lib/cms";
import { cn } from "@/lib/utils";
import type { Client, OrderItem } from "@/types/database";

export function OrderItems({ items }: { items: OrderItem[] }) {
  return items.length ? <ol className="divide-y divide-hairline">
    {items.map((item, index) => <li key={item.id} className="flex flex-wrap items-start gap-3 py-3">
      <span className="pt-1 text-xs tabular-nums text-muted">{String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1"><p className="break-words font-semibold text-ink">{item.name} <span className="text-sm font-normal text-muted">× {item.quantity}</span></p>{item.notes && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">{item.notes}</p>}</div>
      <Badge tone={STATUS_TONE[item.status]}>{orderStatusLabel(item.status)}</Badge>
    </li>)}
  </ol> : <p className="py-3 text-sm text-muted">No separate items added yet.</p>;
}

export function OrderTree({ orders, clients, expandClients = false }: { orders: OrderWithClient[]; clients: Pick<Client, "id" | "name" | "type">[]; expandClients?: boolean }) {
  if (!clients.length) return <EmptyState icon={<ClipboardList className="h-8 w-8" aria-hidden="true" />}>No matching clients or orders.</EmptyState>;
  return <div className="space-y-4">
    {clients.map((client) => {
      const clientOrders = orders.filter((order) => order.client_id === client.id);
      const open = clientOrders.filter((order) => (openOrderStatuses as readonly string[]).includes(order.status)).length;
      const complete = clientOrders.filter((order) => ["completed", "delivered"].includes(order.status)).length;
      // Clients start collapsed, so an urgent order two levels down would be
      // invisible. Surface the count on the row that is always on screen.
      const urgent = clientOrders.filter((order) => order.urgent).length;
      return <details key={client.id} open={expandClients} className="order-client overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface">
        <summary className="flex min-h-20 cursor-pointer list-none items-center gap-4 px-4 py-4 sm:px-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent-deep" aria-hidden="true">{client.name.slice(0, 2).toUpperCase()}</span>
          <span className="min-w-0 flex-1"><span className="block break-words text-base font-bold text-accent-deep">{client.name}</span><span className="mt-1 block text-xs text-muted">{clientTypeShort(client.type)} · {clientOrders.length} orders · {open} open · {complete} completed</span>{urgent > 0 && <span className="mt-1.5 flex"><Badge tone="accent"><TriangleAlert className="h-3 w-3" aria-hidden="true" />{urgent} urgent</Badge></span>}</span>
          <ChevronRight className="tree-chevron h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        </summary>
        <div className="border-t border-hairline px-3 pb-3 sm:px-5">
          {clientOrders.map((order) => <details key={order.id} className={cn("order-branch mt-3 rounded-[var(--radius-ui)] border border-hairline", order.urgent && "border-l-4 border-accent/40 border-l-accent bg-accent/[0.05]")}>
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 px-3 py-4">
              <span className="min-w-0 basis-full sm:flex-1 sm:basis-auto"><span className="block break-words text-sm font-bold text-ink">#{order.order_no} · {order.title}</span><span className="mt-1 block text-xs text-muted">{order.items.length} items{order.site_label ? ` · ${order.site_label}` : ""}</span></span>
              {order.urgent && <Badge tone="accent"><TriangleAlert className="h-3 w-3" aria-hidden="true" />Urgent</Badge>}
              <Badge tone={STATUS_TONE[order.status]}>{orderStatusLabel(order.status)}</Badge>
              <ChevronRight className="tree-chevron ml-auto h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            </summary>
            <div className="border-t border-hairline px-4"><OrderItems items={order.items} /><Link href={`/factory/orders/${order.id}`} className="my-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent">Open / edit order <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" /></Link></div>
          </details>)}
          {!clientOrders.length && <p className="p-4 text-sm text-muted">No orders for this client yet.</p>}
          <Link className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent" href={`/factory/orders/new?client=${client.id}`}>Add an order for {client.name}</Link>
        </div>
      </details>;
    })}
  </div>;
}
