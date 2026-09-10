import type { ReactNode } from "react";
import { Logo, LogoMark } from "@/components/layout/logo";
import { site } from "@/content/site";
import { invoiceBrand, orderStatusLabel } from "@/content/cms";
import { formatPkr } from "@/lib/money";
import { invoiceTotal, labourTotals, showDate } from "@/lib/accounting-core";
import { monthLabel } from "@/lib/cms-core";
import type { OrderDetail } from "@/lib/cms";
import type { InvoiceItem, LabourEntry } from "@/types/database";

/** A printed trading name: the stacked lockup lines plus the full name for a11y. */
export type Brand = { readonly name: string; readonly lines: readonly string[] };

export function Document({ title, reference, children, className = "", brand }: { title: string; reference?: string; children: ReactNode; className?: string; brand?: Brand }) {
  return <article className={`ptf-document ${className}`}>
    <header className="document-header">
      <div>
        {brand ? <div className="invoice-brand-lockup">
          <LogoMark className="invoice-brand-mark" />
          <p className="invoice-brand-name" aria-label={brand.name}>{brand.lines.map((line) => <span key={line}>{line}</span>)}</p>
        </div> : <Logo className="w-44 sm:w-52" />}
        <p className="mt-3 text-xs text-muted">{site.whatsapp.display}</p>
      </div>
      <div className="sm:text-right"><h2 className="font-display text-3xl text-accent">{title}</h2>{reference && <p className="mt-2 text-sm font-semibold tabular-nums text-ink">{reference}</p>}</div>
    </header>
    {children}
    <footer className="document-footer"><span>{brand?.name ?? site.name}</span><span>{reference ?? title}</span></footer>
  </article>;
}

/** Structural, so a shop_invoices row prints through the same document. */
export type InvoiceLike = {
  client_name: string; client_address: string | null; client_phone: string | null;
  issued_on: string; items: InvoiceItem[]; total_amount: number;
  /** Absent on factory invoices, which carry no discount. */
  discount_pct?: number;
  notes: string | null; status: "issued" | "void";
};

export function InvoiceDocument({ invoice, brand = invoiceBrand, reference }: { invoice: InvoiceLike; brand?: Brand; reference?: string }) {
  const discountPct = invoice.discount_pct ?? 0;
  const subtotal = invoiceTotal(invoice.items);
  return <Document title={invoice.status === "void" ? "Voided invoice" : "Invoice"} reference={reference} className="invoice-document" brand={brand}>
    <div className="document-parties">
      <div><p className="document-label">Bill to</p><p className="mt-2 break-words text-lg font-semibold">{invoice.client_name}</p>{invoice.client_address && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-soft">{invoice.client_address}</p>}{invoice.client_phone && <p className="mt-1 text-sm text-ink-soft">{invoice.client_phone}</p>}</div>
      <dl className="text-sm"><dt className="document-label">Invoice date</dt><dd className="mt-2">{showDate(invoice.issued_on)}</dd><dt className="document-label mt-4">Currency</dt><dd className="mt-2">Pakistani rupees (PKR)</dd></dl>
    </div>
    <table className="document-table invoice-table">
      <caption className="sr-only">Invoice items. All prices are in Pakistani rupees.</caption>
      <thead><tr><th scope="col" aria-label="Serial number">S.No.</th><th scope="col">Item</th><th scope="col" className="number">Qty</th><th scope="col" className="number">Unit price<span className="invoice-currency"> (Rs)</span></th><th scope="col" className="number">Total price<span className="invoice-currency"> (Rs)</span></th></tr></thead>
      <tbody>{invoice.items.map((item, index) => <tr key={item.id}>
        <td className="invoice-serial">{index + 1}</td>
        <td><span className="invoice-item-name">{item.item}</span><span className="invoice-item-source">{item.source}</span></td>
        <td className="number">{item.quantity}</td>
        <td className="number">{formatPkr(item.amount).replace(/^Rs /, "")}</td>
        <td className="number invoice-line-total">{formatPkr(BigInt(item.amount) * BigInt(item.quantity)).replace(/^Rs /, "")}</td>
      </tr>)}</tbody>
    </table>
    <div className="invoice-bill">
      <div className="invoice-bill-detail"><span>{invoice.items.length} line items</span><span>Total quantity: {invoice.items.reduce((sum, item) => sum + item.quantity, 0)}</span></div>
      {discountPct > 0 && <dl className="invoice-bill-detail mt-3"><dt>Subtotal</dt><dd>{formatPkr(subtotal)}</dd></dl>}
      {discountPct > 0 && <dl className="invoice-bill-detail mt-1"><dt>Discount {discountPct}%</dt><dd>− {formatPkr(subtotal - BigInt(invoice.total_amount))}</dd></dl>}
      <div className="document-total"><span>Grand total</span><strong>{formatPkr(invoice.total_amount)}</strong></div>
    </div>
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
  const rows = entries.map((entry) => ({ entry, totals: labourTotals(entry) }));
  const sum = (pick: (row: (typeof rows)[number]) => bigint) => rows.reduce((total, row) => total + pick(row), 0n);
  return <Document title="Labour sheet" reference={monthLabel(month)}>
    <p className="mb-6 text-sm text-muted">Salary period: {monthLabel(month)} · {entries.length} {entries.length === 1 ? "entry" : "entries"}</p>
    <table className="document-table labour-table">
      <caption className="sr-only">Labour payslips. All amounts are in Pakistani rupees.</caption>
      <thead><tr>
        <th scope="col">Name</th>
        <th scope="col" className="number">Salary</th>
        <th scope="col" className="number">Overtime</th>
        <th scope="col" className="number">Deductions</th>
        <th scope="col" className="number">Total</th>
        <th scope="col" className="number">Paid</th>
        <th scope="col" className="number">Balance</th>
      </tr></thead>
      <tbody>{rows.map(({ entry, totals }) => <tr key={entry.id}>
        <td data-label="Name">
          {entry.name}
          <p className="mt-1 text-xs text-muted">{showDate(entry.paid_on)}</p>
          {/* The working, so a printed payslip can be checked without the app. */}
          <p className="mt-1 text-xs text-muted">
            Per day {formatPkr(entry.per_day_salary)} · {entry.leaves} {entry.leaves === 1 ? "leave" : "leaves"}
            {entry.ot_hours > 0 ? ` · OT ${entry.ot_hours} h @ ${formatPkr(entry.ot_rate)}` : ""}
            {entry.deduction > 0 ? ` · other ${formatPkr(entry.deduction)}` : ""}
          </p>
        </td>
        <td data-label="Salary" className="number">{formatPkr(entry.salary)}</td>
        <td data-label="Overtime" className="number">{formatPkr(totals.overtime)}</td>
        <td data-label="Deductions" className="number">{formatPkr(totals.leaveDeduction + BigInt(entry.deduction))}</td>
        <td data-label="Total" className="number">{formatPkr(totals.total)}</td>
        <td data-label="Paid" className="number">{formatPkr(totals.paid)}</td>
        <td data-label="Balance" className="number">{formatPkr(totals.balance)}</td>
      </tr>)}</tbody>
    </table>
    <dl className="document-summary">
      <div><dt>Total payable</dt><dd>{formatPkr(sum((row) => row.totals.total))}</dd></div>
      <div><dt>Total paid</dt><dd>{formatPkr(sum((row) => row.totals.paid))}</dd></div>
      <div><dt>Balance remaining</dt><dd>{formatPkr(sum((row) => row.totals.balance))}</dd></div>
    </dl>
    <p className="mt-6 text-xs text-muted">Total payable is salary plus overtime, less leave and other deductions. Total paid includes advance and salary paid.</p>
    {entries.some((row) => row.notes) && <section className="mt-6"><h3 className="document-label">Notes</h3>{entries.filter((row) => row.notes).map((row) => <p key={row.id} className="mt-2 whitespace-pre-wrap break-words text-sm"><strong>{row.name}:</strong> {row.notes}</p>)}</section>}
  </Document>;
}
