import { Plus } from "lucide-react";
import { CmsPage } from "@/components/cms/cms-page";
import { OrderTree } from "@/components/cms/order-tree";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { orderStatuses } from "@/content/cms";
import { getClients, getOrders } from "@/lib/cms";
export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; client?: string }> }) {
  const params = await searchParams;
  const status = orderStatuses.some((row) => row.value === params.status) ? params.status : undefined;
  const clients = await getClients();
  const clientId = clients.some((row) => row.id === params.client) ? params.client : undefined;
  const orders = await getOrders({ status, clientId });
  const shown = clients.filter((client) => (!clientId || client.id === clientId) && (!status || orders.some((row) => row.client_id === client.id)));
  return <CmsPage title="Orders" eyebrow="Clients / orders / items" actions={<ButtonLink href="/cms/orders/new" size="sm"><Plus className="h-4 w-4" aria-hidden="true" />New order</ButtonLink>}>
    <form className="mb-6 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]" action="/cms/orders">
      <Field label="Client" htmlFor="filterClient" className="min-w-0 flex-1"><Select id="filterClient" name="client" defaultValue={clientId ?? ""}><option value="">All clients</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select></Field>
      <Field label="Order status" htmlFor="filterStatus" className="min-w-0 flex-1"><Select id="filterStatus" name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{orderStatuses.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}</Select></Field>
      <Button type="submit" variant="outline">Filter</Button>
    </form>
    <p className="mb-4 text-sm text-muted">{shown.length} clients · {orders.length} orders. Expand a client, then an order to see its items.</p>
    <OrderTree clients={shown} orders={orders} expandClients={Boolean(clientId)} />
  </CmsPage>;
}
