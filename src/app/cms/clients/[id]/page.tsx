import { notFound } from "next/navigation";
import { ClipboardList, Phone, Plus } from "lucide-react";

import { Card, CmsPage, SectionHeading } from "@/components/cms/cms-page";
import { RecordList } from "@/components/cms/record-list";
import { StatCard } from "@/components/cms/stat-card";
import { Badge, STATUS_TONE } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { clientTypeLabel, orderStatusLabel } from "@/content/cms";
import { ClientForm } from "@/features/cms/client-form";
import { getClient, getOrders, orderBalance } from "@/lib/cms";
import { formatPkr, formatPkrShort } from "@/lib/money";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata = { title: "Client" };

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabaseEnv()) notFound();

  const [client, orders] = await Promise.all([getClient(id), getOrders({ clientId: id })]);
  if (!client) notFound();

  const totals = orders.reduce(
    (sum, order) => {
      const { total, paid } = orderBalance(order);
      return { billed: sum.billed + total, outstanding: sum.outstanding + (total - paid) };
    },
    { billed: 0, outstanding: 0 },
  );

  return (
    <CmsPage
      backHref="/cms/clients"
      eyebrow={clientTypeLabel(client.type)}
      title={client.name}
      actions={
        <ButtonLink href={`/cms/orders/new?client=${client.id}`} size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New order
        </ButtonLink>
      }
    >
      {(client.phone || client.address) && (
        <Card className="mb-4 p-4 text-sm leading-6 text-ink-soft">
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="inline-flex items-center gap-2 font-semibold text-accent"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {client.phone}
            </a>
          )}
          {client.address && <p className={client.phone ? "mt-2" : ""}>{client.address}</p>}
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Orders" value={orders.length} />
        <StatCard label="Billed" value={formatPkrShort(totals.billed)} />
        <StatCard label="Outstanding" value={formatPkrShort(totals.outstanding)} tone="accent" />
      </div>

      <section className="mt-9">
        <SectionHeading>Orders</SectionHeading>
        <RecordList
          emptyIcon={<ClipboardList className="h-8 w-8" aria-hidden="true" />}
          empty="No orders for this client yet."
          rows={orders.map((order) => {
            const { balance } = orderBalance(order);
            return {
              id: order.id,
              href: `/cms/orders/${order.id}`,
              title: order.title,
              subtitle: (
                <>
                  #{order.order_no}
                  {order.site_label ? ` · ${order.site_label}` : ""}
                </>
              ),
              meta: (
                <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>
                  {orderStatusLabel(order.status)}
                </Badge>
              ),
              metaSub: (
                <span className="tabular-nums">
                  {balance > 0 ? `${formatPkr(balance)} due` : "Paid in full"}
                </span>
              ),
            };
          })}
        />
      </section>

      <section className="mt-10">
        <SectionHeading>Details</SectionHeading>
        <ClientForm client={client} />
      </section>
    </CmsPage>
  );
}
