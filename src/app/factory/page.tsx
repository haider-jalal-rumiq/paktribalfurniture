import Link from "next/link";
import { Plus, Wallet, ReceiptText, ClipboardList, CalendarCheck } from "lucide-react";
import { CmsPage, EmptyState, NotConfigured, SectionHeading } from "@/components/cms/cms-page";
import { StatCard } from "@/components/cms/stat-card";
import { RecordList } from "@/components/cms/record-list";
import { ButtonLink } from "@/components/ui/button";
import { Badge, STATUS_TONE } from "@/components/ui/badge";
import { orderStatusLabel } from "@/content/cms";
import { getDueSoon, getFinancialTotals, daysUntil } from "@/lib/cms";
import { formatPkr } from "@/lib/money";
import { hasSupabaseEnv } from "@/lib/supabase/config";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const configured = hasSupabaseEnv();
  const [totals, dueSoon] = await Promise.all([getFinancialTotals(), getDueSoon()]);
  return <CmsPage eyebrow="Pak Tribal Furniture" title="Dashboard" actions={<>
    <ButtonLink href="/factory/balances" size="sm"><Plus className="h-4 w-4" aria-hidden="true" />Add balance</ButtonLink>
    <ButtonLink href="/factory/invoices/new" size="sm" variant="outline">New invoice</ButtonLink>
  </>}>
    {!configured && <div className="mb-6"><NotConfigured /></div>}
    {configured && !totals && <p role="alert" className="mb-6 rounded-[var(--radius-card)] border border-accent/30 p-4 text-sm text-accent-deep">Financial totals could not be loaded. Please refresh before recording money.</p>}
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">All-time totals</p>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Credit" value={totals ? formatPkr(totals.credit) : "—"} tone="accent" emphasis icon={<Wallet className="h-4 w-4" />} hint="Available funds: added balance minus expenses" />
      <StatCard label="Expenses" value={totals ? formatPkr(totals.expenses) : "—"} hint="General expenses + paid labour" />
      <StatCard label="Total sales" value={totals ? formatPkr(totals.sales) : "—"} icon={<ReceiptText className="h-4 w-4" />} hint="Issued invoices; excludes voided invoices" />
      <StatCard label="Open orders" value={totals?.openOrders ?? "—"} icon={<ClipboardList className="h-4 w-4" />} hint="Pending, in progress and ready" />
    </div>
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm"><Link href="/factory/balances" className="min-h-11 py-3 font-semibold text-accent">Balance history{totals ? ` · ${formatPkr(totals.added)} added` : ""}</Link><Link href="/factory/expenses" className="min-h-11 py-3 font-semibold text-accent">Record an expense</Link><Link href="/factory/expenses/labour" className="min-h-11 py-3 font-semibold text-accent">Labour sheet</Link></div>
    <section className="mt-9">
      <SectionHeading action={<Link href="/factory/orders" className="text-sm font-semibold text-accent">All orders</Link>}>Due soon</SectionHeading>
      {dueSoon.length ? <RecordList empty="No upcoming deliveries." rows={dueSoon.map((order) => {
        const days = daysUntil(order.expected_date!);
        return { id: order.id, href: `/factory/orders/${order.id}`, title: order.title, subtitle: `#${order.order_no} · ${order.clients?.name ?? "Client"}`, meta: <Badge tone={STATUS_TONE[order.status]}>{orderStatusLabel(order.status)}</Badge>, metaSub: <span className={days < 0 ? "font-semibold text-accent" : "text-muted"}>{days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? "Due today" : `Due in ${days} days`}</span> };
      })} /> : <EmptyState icon={<CalendarCheck className="h-8 w-8" aria-hidden="true" />}>Nothing due in the next seven days.</EmptyState>}
    </section>
  </CmsPage>;
}
