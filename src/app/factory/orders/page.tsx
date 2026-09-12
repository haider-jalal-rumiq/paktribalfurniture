import { Plus } from "lucide-react";
import Link from "next/link";
import { CmsPage, EmptyState } from "@/components/cms/cms-page";
import { OrderTree } from "@/components/cms/order-tree";
import { Badge, STATUS_TONE } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { orderStatuses, orderStatusLabel } from "@/content/cms";
import { getClients, getOrders } from "@/lib/cms";
import { isUrgentOrder, itemMatchesStatus, orderMatchesFilters } from "@/lib/orders";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; client?: string; view?: string; item?: string }> }) {
  const params = await searchParams;
  const byItems = params.view === "items";
  const status = params.status === "urgent" || orderStatuses.some((row) => row.value === params.status) ? params.status : undefined;
  const clients = await getClients();
  const clientId = clients.some((row) => row.id === params.client) ? params.client : undefined;
  const orders = (await getOrders()).filter((order) => orderMatchesFilters(order, { status, clientId, byItems }));
  const shown = clients.filter((client) => (!clientId || client.id === clientId) && (!status || orders.some((row) => row.client_id === client.id)));

  // Two ways to read the same orders: grouped by client, or every item flat.
  const itemQuery = params.item?.trim().toLowerCase() ?? "";
  const allItems = orders
    .flatMap((order) => order.items.map((item) => ({ order, item })))
    .filter(({ item }) => itemMatchesStatus(item, status) && (!itemQuery || item.name.toLowerCase().includes(itemQuery)));
  const pieces = allItems.reduce((count, { item }) => count + item.quantity, 0);
  const itemOrders = new Set(allItems.map(({ order }) => order.id)).size;

  const keep = (extra: Record<string, string>) => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (clientId) query.set("client", clientId);
    if (itemQuery) query.set("item", params.item!.trim());
    for (const [key, value] of Object.entries(extra)) {
      if (value) query.set(key, value); else query.delete(key);
    }
    const text = query.toString();
    return text ? `/factory/orders?${text}` : "/factory/orders";
  };

  return <CmsPage title="Orders" eyebrow="Clients / orders / items" actions={<ButtonLink href="/factory/orders/new" size="sm"><Plus className="h-4 w-4" aria-hidden="true" />New order</ButtonLink>}>
    <nav aria-label="View" className="mb-5 flex gap-2 border-b border-hairline">
      {([{ key: "", label: "By client" }, { key: "items", label: "By item" }] as const).map((tab) => (
        <Link
          key={tab.key}
          href={keep({ view: tab.key })}
          aria-current={byItems === (tab.key === "items") ? "page" : undefined}
          className={cn(
            "min-h-12 border-b-2 px-4 py-3 text-sm font-semibold",
            byItems === (tab.key === "items") ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>

    <form className="mb-6 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]" action="/factory/orders">
      {byItems && <input type="hidden" name="view" value="items" />}
      <Field label="Client" htmlFor="filterClient" className="min-w-0 flex-1">
        <Select id="filterClient" name="client" defaultValue={clientId ?? ""}>
          <option value="">All clients</option>
          {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
        </Select>
      </Field>
      <Field label={byItems ? "Item status / urgency" : "Order status / urgency"} htmlFor="filterStatus" className="min-w-0 flex-1">
        <Select id="filterStatus" name="status" defaultValue={status ?? ""}>
          <option value="">All statuses</option>
          <option value="urgent">Urgent</option>
          {orderStatuses.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
        </Select>
      </Field>
      <Button type="submit" variant="outline">Filter</Button>
    </form>

    {byItems ? <>
      <p className="mb-4 text-sm text-muted">{allItems.length} item lines · {pieces} pieces across {itemOrders} orders.</p>
      {allItems.length ? (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)]">
          <table className="document-table">
            <caption className="sr-only">Every item on every matching order.</caption>
            <thead><tr>
              <th scope="col">Item</th>
              <th scope="col" className="number">Qty</th>
              <th scope="col">Item status</th>
              <th scope="col">Order</th>
              <th scope="col">Client</th>
            </tr></thead>
            <tbody>
              {allItems.map(({ order, item }) => (
                <tr key={`${order.id}-${item.id}`}>
                  <td data-label="Item">
                    <span className="font-semibold">{item.name}</span>
                    {item.notes && <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-muted"><span className="font-semibold text-ink-soft">Measurements / details:</span> {item.notes}</p>}
                  </td>
                  <td data-label="Qty" className="number">{item.quantity}</td>
                  <td data-label="Item status"><Badge tone={STATUS_TONE[item.status]}>{orderStatusLabel(item.status)}</Badge></td>
                  <td data-label="Order">
                    <Link href={`/factory/orders/${order.id}`} className="font-semibold text-accent">#{order.order_no}</Link>
                    <p className="mt-1 max-w-64 break-words text-xs font-medium text-ink-soft">{order.title}</p>
                    {order.description && <p className="mt-1 max-w-64 whitespace-pre-wrap break-words text-xs leading-relaxed text-muted">{order.description}</p>}
                    {isUrgentOrder(order) && <p className="mt-1"><Badge tone="accent">Urgent</Badge></p>}
                  </td>
                  <td data-label="Client" className="font-semibold text-ink-soft">{order.clients?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState>No items match these filters.</EmptyState>}
    </> : <>
      <p className="mb-4 text-sm text-muted">{shown.length} clients · {orders.length} orders · {pieces} pieces. Expand a client, then an order to see its items.</p>
      <OrderTree clients={shown} orders={orders} expandClients={Boolean(clientId)} />
    </>}
  </CmsPage>;
}
