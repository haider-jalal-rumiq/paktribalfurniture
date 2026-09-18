import Link from "next/link";
import { notFound } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { CmsPage, SectionHeading } from "@/components/cms/cms-page";
import { OrderItems } from "@/components/cms/order-tree";
import { Badge, STATUS_TONE } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { orderStatusLabel } from "@/content/cms";
import { OrderForm } from "@/features/cms/order-form";
import { orderTotal } from "@/lib/accounting-core";
import { getClients, getInventory, getOrder } from "@/lib/cms";
import { formatPkr } from "@/lib/money";
import { isUrgentOrder } from "@/lib/orders";
import { signedOrderImageUrls } from "@/lib/order-images";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, clients, supabase, stock] = await Promise.all([getOrder(id), getClients(), createSupabaseServerClient(), getInventory()]);
  if (!order) notFound();
  const photos = supabase ? await signedOrderImageUrls(supabase, order.image_paths) : [];
  return <CmsPage backHref="/factory/orders" eyebrow={`Order #${order.order_no}`} title={order.title} actions={<ButtonLink href={`/factory/orders/${id}/print`} size="sm" variant="outline">Print / PDF</ButtonLink>}>
    <div className="flex flex-wrap items-center gap-3">{isUrgentOrder(order) && <Badge tone="accent"><TriangleAlert className="h-3 w-3" aria-hidden="true" />Urgent</Badge>}<Badge tone={STATUS_TONE[order.status]}>{orderStatusLabel(order.status)}</Badge>{order.clients && <Link className="text-sm font-semibold text-accent" href={`/factory/clients/${order.clients.id}`}>{order.clients.name}</Link>}{order.site_label && <span className="text-sm text-muted">{order.site_label}</span>}</div>
    <section className="mt-6 rounded-[var(--radius-card)] border border-hairline p-4"><SectionHeading>Items and progress</SectionHeading><OrderItems items={order.items} /><div className="mt-3 flex flex-wrap items-baseline justify-between gap-3 border-t border-hairline pt-3"><span className="text-sm font-semibold text-ink-soft">Order value</span><span className="break-all text-lg font-bold tabular-nums text-accent">{formatPkr(orderTotal(order.items))}</span></div></section>
    <section className="mt-9"><SectionHeading>Edit order</SectionHeading><OrderForm order={order} clients={clients} photos={photos} stock={stock ?? []} /></section>
  </CmsPage>;
}
