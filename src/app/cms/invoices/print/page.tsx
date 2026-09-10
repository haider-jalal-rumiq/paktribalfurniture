import { CmsPage, EmptyState } from "@/components/cms/cms-page";
import { Document, InvoiceDocument } from "@/components/cms/documents";
import { PrintButton } from "@/components/cms/print-button";
import { parseInvoiceFilters } from "@/features/cms/invoice-filters";
import { getInvoices } from "@/lib/cms";
import { invoiceNumber, showDate } from "@/lib/accounting-core";
import { formatPkr } from "@/lib/money";
export const metadata = { title: "Print invoices" };
export default async function PrintInvoicesPage({ searchParams }: { searchParams: Promise<{ client?: string; from?: string; to?: string; status?: string }> }) {
  const { filters, error, query } = parseInvoiceFilters(await searchParams);
  const invoices = error ? [] : await getInvoices(filters);
  const total = invoices.reduce((sum, row) => sum + BigInt(row.total_amount), 0n);
  return <CmsPage title="Invoice report" backHref={`/cms/invoices?${query}`} actions={invoices.length ? <PrintButton /> : undefined}>
    {error && <p role="alert" className="text-sm text-accent-deep">{error}</p>}
    {invoices.length > 0 && <><p className="print-controls mb-5 text-sm text-muted">This report includes the summary and every matching invoice. Choose Save as PDF to download it.</p><Document title={filters.status === "void" ? "Voided invoices" : "Invoice report"} reference={`${filters.from ? showDate(filters.from) : "All dates"}${filters.to ? ` to ${showDate(filters.to)}` : ""}`}>
      <table className="document-table"><thead><tr><th scope="col">Invoice / client</th><th scope="col">Date</th><th scope="col" className="number">Total</th></tr></thead><tbody>{invoices.map((row) => <tr key={row.id}><td data-label="Invoice / client">{invoiceNumber(row.invoice_no)}<p className="mt-1 text-xs text-muted">{row.client_name}</p></td><td data-label="Date">{showDate(row.issued_on)}</td><td data-label="Total" className="number">{formatPkr(row.total_amount)}</td></tr>)}</tbody></table><div className="document-total"><span>{invoices.length} invoices</span><strong>{formatPkr(total)}</strong></div>
    </Document>{invoices.map((invoice) => <InvoiceDocument key={invoice.id} invoice={invoice} />)}</>}
    {!invoices.length && !error && <EmptyState>No invoices to print.</EmptyState>}
  </CmsPage>;
}
