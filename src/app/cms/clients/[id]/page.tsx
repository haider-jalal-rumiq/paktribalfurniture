import { notFound } from "next/navigation";
import { CmsPage, SectionHeading } from "@/components/cms/cms-page";
import { OrderTree } from "@/components/cms/order-tree";
import { StatCard } from "@/components/cms/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { clientTypeLabel } from "@/content/cms";
import { ClientForm } from "@/features/cms/client-form";
import { getClient, getOrders, getInvoices } from "@/lib/cms";
import { formatPkr } from "@/lib/money";
export const metadata = { title: "Client" };
export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, orders, invoices] = await Promise.all([getClient(id), getOrders({ clientId: id }), getInvoices({ client: id, status: "issued" })]);
  if (!client) notFound();
  const total = invoices.reduce((sum, invoice) => sum + BigInt(invoice.total_amount), 0n);
  return <CmsPage backHref="/cms/clients" eyebrow={clientTypeLabel(client.type)} title={client.name} actions={<><ButtonLink href={`/cms/orders/new?client=${id}`} size="sm">New order</ButtonLink><ButtonLink href={`/cms/invoices?client=${id}`} variant="outline" size="sm">Client invoices</ButtonLink></>}>
    <div className="grid gap-3 sm:grid-cols-3"><StatCard label="Orders" value={orders.length} /><StatCard label="Invoices" value={invoices.length} /><StatCard label="Total sales" value={formatPkr(total)} tone="accent" /></div>
    <section className="mt-9"><SectionHeading>Orders</SectionHeading><OrderTree clients={[client]} orders={orders} expandClients /></section>
    <section className="mt-9"><SectionHeading>Client details</SectionHeading><ClientForm client={client} /></section>
  </CmsPage>;
}
