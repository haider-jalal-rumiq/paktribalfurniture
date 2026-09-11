import { Plus, TriangleAlert } from "lucide-react";
import { CmsPage } from "@/components/cms/cms-page";
import { OrderTree } from "@/components/cms/order-tree";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { orderStatuses } from "@/content/cms";
import { getClients, getOrders } from "@/lib/cms";
export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; client?: string; urgent?: string }> }) {
  const params = await searchParams;
  const status = orderStatuses.some((row) => row.value === params.status) ? params.status : undefined;
  const clients = await getClients();
  const clientId = clients.some((row) => row.id === params.client) ? params.client : undefined;
  const urgentOnly = params.urgent === "1";
  const orders = await getOrders({ status, clientId, urgentOnly });
  const filteringOrders = Boolean(status || clientId || urgentOnly);
  const shown = clients.filter((client) => (!clientId || client.id === clientId) && (!filteringOrders || orders.some((row) => row.client_id === client.id)));
  const toggleParams = new URLSearchParams();
  if (clientId) toggleParams.set("client", clientId);
  if (status) toggleParams.set("status", status);
  if (!urgentOnly) toggleParams.set("urgent", "1");
  const toggleQuery = toggleParams.toString();
  const urgentHref = toggleQuery ? `/factory/orders?${toggleQuery}` : "/factory/orders";
  return <CmsPage title="Orders" eyebrow="Clients / orders / items" actions={<><ButtonLink href={urgentHref} size="sm" variant={urgentOnly ? "primary" : "outline"} aria-current={urgentOnly ? "page" : undefined}><TriangleAlert className="h-4 w-4" aria-hidden="true" />{urgentOnly ? "Show all orders" : "Urgent orders"}</ButtonLink><ButtonLink href="/factory/orders/new" size="sm"><Plus className="h-4 w-4" aria-hidden="true" />New order</ButtonLink></>}>
    <form className="mb-6 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]" action="/factory/orders">
      <Field label="Client" htmlFor="filterClient" className="min-w-0 flex-1"><Select id="filterClient" name="client" defaultValue={clientId ?? ""}><option value="">All clients</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select></Field>
      <Field label="Order status" htmlFor="filterStatus" className="min-w-0 flex-1"><Select id="filterStatus" name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{orderStatuses.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}</Select></Field>
      {urgentOnly && <input type="hidden" name="urgent" value="1" />}
      <Button type="submit" variant="outline">Filter</Button>
    </form>
    <p className="mb-4 text-sm text-muted">{shown.length} clients · {orders.length} {urgentOnly ? "urgent " : ""}orders. Expand a client, then an order to see its items.</p>
    <OrderTree clients={shown} orders={orders} expandClients={Boolean(clientId)} />
  </CmsPage>;
}
