import Link from "next/link";
import { notFound } from "next/navigation";

import { CmsPage } from "@/components/cms/cms-page";
import { StatCard } from "@/components/cms/stat-card";
import { orderStatusLabel, paymentMethodLabel } from "@/content/cms";
import { OrderForm } from "@/features/cms/order-form";
import { DeletePaymentButton, PaymentForm } from "@/features/cms/payment-form";
import { daysUntil, getClients, getOrder, orderBalance } from "@/lib/cms";
import { formatPkr } from "@/lib/money";
import { signedOrderImageUrls } from "@/lib/order-images";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const payments = [...order.order_payments].sort((a, b) => b.paid_on.localeCompare(a.paid_on));

  return (
    <CmsPage
      eyebrow={`Order #${order.order_no} · ${orderStatusLabel(order.status)}`}
      title={order.title}
    >
      <p className="mt-4 text-sm text-muted">
        {order.clients ? (
          <Link href={`/cms/clients/${order.clients.id}`} className="font-semibold text-accent">
            {order.clients.name}
          </Link>
        ) : (
          "Unknown client"
        )}
        {order.site_label ? ` · ${order.site_label}` : ""}
        {" · ordered "}
        {showDate(order.order_date)}
        {order.expected_date && ` · due ${showDate(order.expected_date)}`}
        {days !== null && days < 0 && (
          <span className="font-semibold text-accent-deep"> · {Math.abs(days)} days overdue</span>
        )}
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatCard label="Total" value={formatPkr(total)} />
        <StatCard label="Received" value={formatPkr(paid)} />
        <StatCard label="Balance" value={formatPkr(balance)} tone={balance > 0 ? "accent" : "neutral"} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-3xl text-ink">Payments</h2>
        <PaymentForm orderId={order.id} balance={balance} />

        {payments.length ? (
          <ul className="mt-5 divide-y divide-hairline border-y border-hairline">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center gap-3 py-3 sm:px-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{formatPkr(payment.amount)}</p>
                  <p className="mt-1 text-xs text-muted">
                    {showDate(payment.paid_on)} · {paymentMethodLabel(payment.method)}
                    {payment.note ? ` · ${payment.note}` : ""}
                  </p>
                </div>
                <DeletePaymentButton paymentId={payment.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-muted">No payments recorded yet.</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl text-ink">Order details</h2>
        <OrderForm order={order} clients={clients} photos={photos} />
      </section>
    </CmsPage>
  );
}
