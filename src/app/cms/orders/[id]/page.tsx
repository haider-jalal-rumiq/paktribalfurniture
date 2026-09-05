import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Phone, Receipt } from "lucide-react";

import { Card, CmsPage, SectionHeading } from "@/components/cms/cms-page";
import { Badge, STATUS_TONE } from "@/components/ui/badge";
import { orderStatusLabel, paymentMethodLabel } from "@/content/cms";
import { OrderForm } from "@/features/cms/order-form";
import { DeletePaymentButton, PaymentForm } from "@/features/cms/payment-form";
import { daysUntil, getClients, getOrder, orderBalance } from "@/lib/cms";
import { formatPkr } from "@/lib/money";
import { signedOrderImageUrls } from "@/lib/order-images";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Order" };

const dateFormatter = new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "UTC" });
const showDate = (value: string) => dateFormatter.format(new Date(`${value}T00:00:00Z`));

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabaseEnv()) notFound();

  const [order, clients, supabase] = await Promise.all([
    getOrder(id),
    getClients(),
    createSupabaseServerClient(),
  ]);
  if (!order) notFound();

  const photos = supabase ? await signedOrderImageUrls(supabase, order.image_paths) : [];
  const { total, paid, balance } = orderBalance(order);
  const days = order.expected_date ? daysUntil(order.expected_date) : null;
  const overdue =
    days !== null && days < 0 && order.status !== "delivered" && order.status !== "cancelled";
  const payments = [...order.order_payments].sort((a, b) => b.paid_on.localeCompare(a.paid_on));
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  return (
    <CmsPage backHref="/cms/orders" eyebrow={`Order #${order.order_no}`} title={order.title}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>{orderStatusLabel(order.status)}</Badge>
        {order.clients && (
          <Link
            href={`/cms/clients/${order.clients.id}`}
            className="text-sm font-semibold text-accent hover:underline"
          >
            {order.clients.name}
          </Link>
        )}
        {order.site_label && <span className="text-sm text-muted">{order.site_label}</span>}
      </div>

      {/* Money panel — the reason this page gets opened. */}
      <Card className="mt-5 p-5">
        {/* Stacks on a phone: side by side, a six-figure total wraps mid-number. */}
        <div className="sm:flex sm:items-end sm:justify-between sm:gap-4">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">
              Balance due
            </p>
            <p
              className={cn(
                "mt-1 whitespace-nowrap font-display text-[2.1rem] leading-none tabular-nums sm:text-[2.75rem]",
                balance > 0 ? "text-accent" : "text-status-good",
              )}
            >
              {formatPkr(balance)}
            </p>
          </div>
          <p className="mt-2 text-sm tabular-nums text-muted sm:mt-0 sm:text-right">
            <span className="font-semibold text-ink">{formatPkr(paid)}</span> received of{" "}
            {formatPkr(total)}
          </p>
        </div>
        <span className="mt-4 block h-2 w-full overflow-hidden rounded-full bg-wash">
          <span
            className={cn("block h-full rounded-full", balance > 0 ? "bg-accent" : "bg-status-good")}
            style={{ width: `${pct}%` }}
          />
        </span>
      </Card>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card className="flex items-start gap-3 p-4">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Dates</dt>
            <dd className="mt-1 text-sm leading-6 text-ink-soft">
              Ordered {showDate(order.order_date)}
              {order.expected_date && (
                <>
                  <br />
                  Due {showDate(order.expected_date)}
                  {overdue && (
                    <span className="font-semibold text-accent"> · {Math.abs(days!)} days late</span>
                  )}
                </>
              )}
            </dd>
          </div>
        </Card>

        {(order.delivery_address || order.contact_phone) && (
          <Card className="flex items-start gap-3 p-4">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Delivery
              </dt>
              <dd className="mt-1 text-sm leading-6 text-ink-soft">
                {order.delivery_address}
                {order.contact_phone && (
                  <>
                    <br />
                    <a
                      href={`tel:${order.contact_phone}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-accent"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {order.contact_phone}
                    </a>
                  </>
                )}
              </dd>
            </div>
          </Card>
        )}
      </dl>

      <section className="mt-9">
        <SectionHeading>Payments</SectionHeading>
        <PaymentForm orderId={order.id} balance={balance} />

        {payments.length ? (
          <ul className="mt-4 divide-y divide-hairline overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)]">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-good/12 text-status-good">
                  <Receipt className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold tabular-nums text-ink">{formatPkr(payment.amount)}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {showDate(payment.paid_on)} · {paymentMethodLabel(payment.method)}
                    {payment.note ? ` · ${payment.note}` : ""}
                  </p>
                </div>
                <DeletePaymentButton paymentId={payment.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">No payments recorded yet.</p>
        )}
      </section>

      <section className="mt-10">
        <SectionHeading>Order details</SectionHeading>
        <OrderForm order={order} clients={clients} photos={photos} />
      </section>
    </CmsPage>
  );
}
