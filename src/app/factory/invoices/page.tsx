import Link from "next/link";
import { Plus } from "lucide-react";
import { CmsPage, EmptyState } from "@/components/cms/cms-page";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { parseInvoiceFilters } from "@/features/cms/invoice-filters";
import { getClients, getInvoices } from "@/lib/cms";
import { invoiceNumber, showDate } from "@/lib/accounting-core";
import { formatPkr } from "@/lib/money";
export const metadata = { title: "Invoices" };
export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ client?: string; from?: string; to?: string; status?: string }> }) {
  const { filters, error, query } = parseInvoiceFilters(await searchParams);
  const [clients, invoices] = await Promise.all([getClients(), error ? Promise.resolve([]) : getInvoices(filters)]);
  const total = invoices.reduce((sum, row) => sum + BigInt(row.total_amount), 0n);
  const grouped = clients.filter((client) => invoices.some((row) => row.client_id === client.id));
  return <CmsPage title="Invoices" eyebrow="Sales" actions={<><ButtonLink href={`/factory/invoices/new${filters.client ? `?client=${filters.client}` : ""}`} size="sm"><Plus className="h-4 w-4" aria-hidden="true" />New invoice</ButtonLink>{invoices.length > 0 && <ButtonLink href={`/factory/invoices/print?${query}`} size="sm" variant="outline">Print / PDF results</ButtonLink>}</>}>
    <form action="/factory/invoices" className="mb-6 grid items-end gap-3 rounded-[var(--radius-card)] border border-hairline p-4 sm:grid-cols-2 lg:grid-cols-5">
      <Field label="Client" htmlFor="invoiceClientFilter"><Select id="invoiceClientFilter" name="client" defaultValue={filters.client ?? ""}><option value="">All clients</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select></Field>
      <Field label="From" htmlFor="from"><Input id="from" name="from" type="date" defaultValue={filters.from} /></Field>
      <Field label="To (inclusive)" htmlFor="to"><Input id="to" name="to" type="date" defaultValue={filters.to} /></Field>
      <Field label="Status" htmlFor="invoiceStatus"><Select id="invoiceStatus" name="status" defaultValue={filters.status}><option value="issued">Issued</option><option value="void">Voided</option></Select></Field>
      <div className="flex items-center gap-3"><Button type="submit" variant="outline">Filter</Button><Link className="text-sm text-muted" href="/factory/invoices">Reset</Link></div>
    </form>
    {error && <p role="alert" className="mb-5 text-sm text-accent-deep">{error}</p>}
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3"><p className="text-sm text-muted">{invoices.length} {filters.status === "void" ? "voided" : "issued"} invoices{filters.from || filters.to ? " in this date range" : " · all dates"}</p><p className="break-all text-lg font-bold tabular-nums text-accent">{formatPkr(total)}</p></div>
    {grouped.map((client) => <section key={client.id} className="mb-6 overflow-hidden rounded-[var(--radius-card)] border border-hairline"><h2 className="bg-canvas-deep px-4 py-4 font-display text-xl">{client.name}</h2><ul className="divide-y divide-hairline">{invoices.filter((row) => row.client_id === client.id).map((row) => <li key={row.id}><Link className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-wash/50" href={`/factory/invoices/${row.id}`}><div><p className="text-sm font-bold">{invoiceNumber(row.invoice_no)}</p><p className="mt-1 text-xs text-muted">{showDate(row.issued_on)} · {row.items.length} items</p></div><span className="break-all text-sm font-semibold tabular-nums">{formatPkr(row.total_amount)}</span></Link></li>)}</ul></section>)}
    {!invoices.length && !error && <EmptyState>No invoices match these filters.</EmptyState>}
  </CmsPage>;
}
