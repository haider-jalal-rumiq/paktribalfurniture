import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { site } from "@/content/site";
import { orderStatusLabel } from "@/content/cms";
import { formatPkr } from "@/lib/money";
import { invoiceNumber, labourAmounts, showDate } from "@/lib/accounting-core";
import { monthLabel } from "@/lib/cms-core";
import type { OrderDetail } from "@/lib/cms";
import type { Invoice, LabourEntry } from "@/types/database";

export function Document({ title, reference, children }: { title: string; reference?: string; children: ReactNode }) {
  return <article className="ptf-document">
    <header className="document-header">
      <div><Logo className="w-44 sm:w-52" /><p className="mt-3 text-xs text-muted">{site.whatsapp.display}</p></div>
      <div className="sm:text-right"><h2 className="font-display text-3xl text-accent">{title}</h2>{reference && <p className="mt-2 text-sm font-semibold tabular-nums text-ink">{reference}</p>}</div>
    </header>
    {children}
    <footer className="document-footer"><span>{site.name}</span><span>{reference ?? title}</span></footer>
  </article>;
}

export function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  return <Document title={invoice.status === "void" ? "Voided invoice" : "Invoice"} reference={invoiceNumber(invoice.invoice_no)}>
    <div className="document-parties">
      <div><p className="document-label">Bill to</p><p className="mt-2 break-words text-lg font-semibold">{invoice.client_name}</p>{invoice.client_address && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-soft">{invoice.client_address}</p>}{invoice.client_phone && <p className="mt-1 text-sm text-ink-soft">{invoice.client_phone}</p>}</div>
      <dl className="text-sm"><dt className="document-label">Invoice date</dt><dd className="mt-2">{showDate(invoice.issued_on)}</dd><dt className="document-label mt-4">Currency</dt><dd className="mt-2">Pakistani rupees (PKR)</dd></dl>
    </div>
    <table className="document-table invoice-table">
      <thead><tr><th scope="col">Item</th><th scope="col">Stock / order</th><th scope="col" className="number">Qty</th><th scope="col" className="number">Unit amount</th><th scope="col" className="number">Amount</th></tr></thead>
      <tbody>{invoice.items.map((item) => <tr key={item.id}><td data-label="Item">{item.item}</td><td data-label="Stock / order">{item.source}</td><td data-label="Qty" className="number">{item.quantity}</td><td data-label="Unit amount" className="number">{formatPkr(item.amount)}</td><td data-label="Amount" className="number">{formatPkr(BigInt(item.amount) * BigInt(item.quantity))}</td></tr>)}</tbody>
    </table>
    <div className="document-total"><span>Total amount</span><strong>{formatPkr(invoice.total_amount)}</strong></div>
    {invoice.status === "void" && <p className="mt-5 text-sm font-semibold text-accent">Voided. Excluded from Total sales.</p>}
    {invoice.notes && <section className="mt-8"><h3 className="document-label">Notes</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-soft">{invoice.notes}</p></section>}
  </Document>;
}

export function OrderDocument({ order }: { order: OrderDetail }) {
  return <Document title="Order sheet" reference={`Order #${order.order_no}`}>
    <div className="document-parties">
      <div><p className="document-label">Client</p><p className="mt-2 break-words text-lg font-semibold">{order.clients?.name}</p>{order.site_label && <p className="text-sm text-ink-soft">{order.site_label}</p>}<p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-soft">{order.delivery_address || order.clients?.address}</p><p className="text-sm text-ink-soft">{order.contact_phone || order.clients?.phone}</p></div>
      <dl className="space-y-2 text-sm"><div><dt className="document-label">Ordered</dt><dd>{showDate(order.order_date)}</dd></div>{order.expected_date && <div><dt className="document-label">Expected delivery</dt><dd>{showDate(order.expected_date)}</dd></div>}<div><dt className="document-label">Status</dt><dd>{orderStatusLabel(order.status)}</dd></div></dl>
    </div>
    <h3 className="mb-3 font-display text-2xl">{order.title}</h3>
    {order.description && <p className="mb-6 whitespace-pre-wrap break-words text-sm text-ink-soft">{order.description}</p>}
    <table className="document-table"><thead><tr><th scope="col">Item</th><th scope="col" className="number">Qty</th><th scope="col">Status</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id}><td data-label="Item">{item.name}{item.notes && <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{item.notes}</p>}</td><td data-label="Qty" className="number">{item.quantity}</td><td data-label="Status">{orderStatusLabel(item.status)}</td></tr>)}</tbody></table>
    {!order.items.length && <p className="mt-4 text-sm text-muted">No separate items recorded.</p>}
    {order.notes && <section className="mt-8"><h3 className="document-label">Notes</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-soft">{order.notes}</p></section>}
  </Document>;
}

export function LabourDocument({ entries, month }: { entries: LabourEntry[]; month: string }) {
  const totals = entries.reduce((sum, row) => ({ total: sum.total + BigInt(row.total_amount), paid: sum.paid + labourAmounts(row).paid, balance: sum.balance + labourAmounts(row).balance }), { total: 0n, paid: 0n, balance: 0n });
  return <Document title="Labour sheet" reference={monthLabel(month)}>
    <p className="mb-6 text-sm text-muted">Salary period: {monthLabel(month)} · {entries.length} {entries.length === 1 ? "entry" : "entries"}</p>
    <table className="document-table labour-table"><thead><tr><th scope="col">Name</th><th scope="col" className="number">Salary</th><th scope="col" className="number">Leaves</th><th scope="col" className="number">Total</th><th scope="col" className="number">Advance</th><th scope="col" className="number">Salary paid</th><th scope="col" className="number">Balance</th></tr></thead><tbody>{entries.map((row) => <tr key={row.id}><td data-label="Name">{row.name}<p className="mt-1 text-xs text-muted">{showDate(row.paid_on)}</p></td><td data-label="Salary" className="number">{formatPkr(row.salary)}</td><td data-label="Leaves" className="number">{row.leaves}</td><td data-label="Total" className="number">{formatPkr(row.total_amount)}</td><td data-label="Advance" className="number">{formatPkr(row.advance)}</td><td data-label="Salary paid" className="number">{formatPkr(row.salary_paid)}</td><td data-label="Balance" className="number">{formatPkr(labourAmounts(row).balance)}</td></tr>)}</tbody></table>
    <dl className="document-summary"><div><dt>Total amount</dt><dd>{formatPkr(totals.total)}</dd></div><div><dt>Total paid</dt><dd>{formatPkr(totals.paid)}</dd></div><div><dt>Balance remaining</dt><dd>{formatPkr(totals.balance)}</dd></div></dl>
    <p className="mt-6 text-xs text-muted">Total paid includes advance and salary paid. Leaves are recorded without automatic salary deductions.</p>
    {entries.some((row) => row.notes) && <section className="mt-6"><h3 className="document-label">Notes</h3>{entries.filter((row) => row.notes).map((row) => <p key={row.id} className="mt-2 whitespace-pre-wrap break-words text-sm"><strong>{row.name}:</strong> {row.notes}</p>)}</section>}
  </Document>;
}
