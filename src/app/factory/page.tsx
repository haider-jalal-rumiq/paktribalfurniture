import Link from "next/link";
import { ReceiptText, ClipboardList, CalendarCheck, TriangleAlert, PackageCheck, PackageX, Boxes } from "lucide-react";
import { CmsPage, EmptyState, NotConfigured, SectionHeading } from "@/components/cms/cms-page";
import { StatCard } from "@/components/cms/stat-card";
import { RecordList } from "@/components/cms/record-list";
import { ButtonLink } from "@/components/ui/button";
import { Badge, STATUS_TONE } from "@/components/ui/badge";
import { openOrderStatuses, orderStatusLabel } from "@/content/cms";
import { getAllOrders, getDueSoon, getFinancialTotals, getOutOfStock, getUrgentOrders, daysUntil } from "@/lib/cms";
import { isUrgentOrder } from "@/lib/orders";
import { formatPkr } from "@/lib/money";
import { hasSupabaseEnv } from "@/lib/supabase/config";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const configured = hasSupabaseEnv();
  const [totals, dueSoon, urgent, orders, outOfStock] = await Promise.all([
    getFinancialTotals(), getDueSoon(), getUrgentOrders(), getAllOrders(), getOutOfStock(),
  ]);

  const open = orders.filter((order) => (openOrderStatuses as readonly string[]).includes(order.status));
  const completed = orders.filter((order) => ["completed", "delivered"].includes(order.status));
  // Pieces, not lines: six chairs on one line is six items to build.
  const orderItems = orders.reduce((count, order) => count + order.items.reduce((n, item) => n + item.quantity, 0), 0);
  return <CmsPage eyebrow="Pak Tribal Furniture" title="Dashboard" actions={
    <ButtonLink href="/factory/invoices/new" size="sm" variant="outline">New invoice</ButtonLink>
  }>
    {!configured && <div className="mb-6"><NotConfigured /></div>}
    {/* 6. Restocking is the action, so the warning links straight to it. */}
    {outOfStock.length > 0 && <div role="alert" className="mb-6 rounded-[var(--radius-card)] border border-accent/30 bg-accent/8 p-4">
      <p className="flex flex-wrap items-center gap-2 font-semibold text-accent-deep">
        <PackageX className="h-5 w-5" aria-hidden="true" />
        {outOfStock.length} {outOfStock.length === 1 ? "design is" : "designs are"} out of stock
      </p>
      <p className="mt-2 break-words text-sm text-ink-soft">
        {outOfStock.slice(0, 6).map((item) => `${item.name} (${item.code})`).join(" · ")}
        {outOfStock.length > 6 ? ` · and ${outOfStock.length - 6} more` : ""}
      </p>
      <Link href="/factory/inventory" className="mt-3 inline-flex min-h-11 items-center font-semibold text-accent">Add items in the inventory</Link>
    </div>}
    {configured && !totals && <p role="alert" className="mb-6 rounded-[var(--radius-card)] border border-accent/30 p-4 text-sm text-accent-deep">Financial totals could not be loaded. Please refresh before recording money.</p>}
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">All-time totals</p>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Expenses" value={totals ? formatPkr(totals.expenses) : "—"} hint="General expenses + paid labour" />
      <StatCard label="Total sales" value={totals ? formatPkr(totals.sales) : "—"} icon={<ReceiptText className="h-4 w-4" />} hint="Issued invoices; excludes voided invoices" />
      {/* 2. Both order tiles open the full list rather than being dead ends. */}
      <Link href="/factory/orders" className="rounded-[var(--radius-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
        <StatCard label="Open orders" value={open.length} icon={<ClipboardList className="h-4 w-4" />} hint="Pending, in progress and ready · open the list" className="h-full transition-colors hover:border-accent" />
      </Link>
      <Link href="/factory/orders?view=items" className="rounded-[var(--radius-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
        <StatCard label="Order items" value={orderItems} icon={<Boxes className="h-4 w-4" />} hint="Pieces across every order · see them all" className="h-full transition-colors hover:border-accent" />
      </Link>
    </div>
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm"><Link href="/factory/balances" className="min-h-11 py-3 font-semibold text-accent">Balance history{totals ? ` · ${formatPkr(totals.added)} added` : ""}</Link><Link href="/factory/expenses" className="min-h-11 py-3 font-semibold text-accent">Record an expense</Link><Link href="/factory/expenses/labour" className="min-h-11 py-3 font-semibold text-accent">Labour sheet</Link></div>
    {urgent.length > 0 && <section className="mt-9">
      <SectionHeading action={<Link href="/factory/orders" className="text-sm font-semibold text-accent">All orders</Link>}>Urgent · {urgent.length}</SectionHeading>
      <RecordList empty="Nothing urgent." rows={urgent.map((order) => {
        const days = order.expected_date ? daysUntil(order.expected_date) : null;
        return {
          id: order.id,
          href: `/factory/orders/${order.id}`,
          lead: <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/12 text-accent" aria-hidden="true"><TriangleAlert className="h-5 w-5" /></span>,
          title: order.title,
          subtitle: `#${order.order_no} · ${order.clients?.name ?? "Client"}`,
          meta: <Badge tone={STATUS_TONE[order.status]}>{orderStatusLabel(order.status)}</Badge>,
          metaSub: days === null
            ? <span className="text-muted">Marked urgent</span>
            : <span className="font-semibold text-accent">{days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? "Due today" : `Due in ${days} days`}</span>,
        };
      })} />
    </section>}
    <section className="mt-9">
      <SectionHeading action={<Link href="/factory/orders" className="text-sm font-semibold text-accent">All orders</Link>}>Due soon</SectionHeading>
      {dueSoon.length ? <RecordList empty="No upcoming deliveries." rows={dueSoon.map((order) => {
        const days = daysUntil(order.expected_date!);
        return { id: order.id, href: `/factory/orders/${order.id}`, title: order.title, subtitle: `#${order.order_no} · ${order.clients?.name ?? "Client"}`, meta: <span className="flex flex-wrap justify-end gap-1.5">{isUrgentOrder(order) && <Badge tone="accent"><TriangleAlert className="h-3 w-3" aria-hidden="true" />Urgent</Badge>}<Badge tone={STATUS_TONE[order.status]}>{orderStatusLabel(order.status)}</Badge></span>, metaSub: <span className={days < 0 ? "font-semibold text-accent" : "text-muted"}>{days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? "Due today" : `Due in ${days} days`}</span> };
      })} /> : <EmptyState icon={<CalendarCheck className="h-8 w-8" aria-hidden="true" />}>Nothing due in the next seven days.</EmptyState>}
    </section>

    <section className="mt-9">
      <SectionHeading action={<Link href="/factory/orders?status=completed" className="text-sm font-semibold text-accent">All completed</Link>}>
        Completed · {completed.length}
      </SectionHeading>
      <RecordList
        empty="No completed orders yet."
        emptyIcon={<PackageCheck className="h-8 w-8" aria-hidden="true" />}
        rows={completed.slice(0, 8).map((order) => ({
          id: order.id,
          href: `/factory/orders/${order.id}`,
          title: order.title,
          subtitle: `#${order.order_no} · ${order.clients?.name ?? "Client"}`,
          meta: <Badge tone={STATUS_TONE[order.status]}>{orderStatusLabel(order.status)}</Badge>,
          metaSub: <span className="text-muted">{order.items.reduce((n, item) => n + item.quantity, 0)} items</span>,
        }))}
      />
      {completed.length > 8 && <p className="mt-3 text-sm text-muted">Showing the 8 most recent of {completed.length}.</p>}
    </section>
  </CmsPage>;
}
