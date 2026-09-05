import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { CmsPage } from "@/components/cms/cms-page";
import { RecordList } from "@/components/cms/record-list";
import { StatCard } from "@/components/cms/stat-card";
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
      eyebrow={clientTypeLabel(client.type)}
      title={client.name}
      actions={
        <ButtonLink href={`/cms/orders/new?client=${client.id}`} size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New order
        </ButtonLink>
      }
    >
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Orders" value={orders.length} />
        <StatCard label="Billed" value={formatPkrShort(totals.billed)} />
        <StatCard label="Outstanding" value={formatPkrShort(totals.outstanding)} tone="accent" />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-3xl text-ink">Orders</h2>
        <div className="mt-4">
          <RecordList
            empty="No orders for this client yet."
            rows={orders.map((order) => {
              const { balance } = orderBalance(order);
              return {
                id: order.id,
                href: `/cms/orders/${order.id}`,
                title: `#${order.order_no} · ${order.title}`,
                subtitle: order.site_label ?? undefined,
                meta: orderStatusLabel(order.status),
                metaSub: balance > 0 ? `${formatPkr(balance)} due` : "Paid in full",
              };
            })}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl text-ink">Details</h2>
        <ClientForm client={client} />
      </section>
    </CmsPage>
  );
}
