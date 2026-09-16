import { notFound } from "next/navigation";

import { CmsPage } from "@/components/cms/cms-page";
import { InvoiceDocument } from "@/components/cms/documents";
import { InvoiceShare } from "@/components/cms/invoice-share";
import { PrintButton } from "@/components/cms/print-button";
import { invoiceBrand } from "@/content/cms";
import { invoiceNumber, invoiceTotal } from "@/lib/accounting-core";
import { getInvoicesByIds } from "@/lib/cms";
import { today } from "@/lib/cms-core";

export const metadata = { title: "Combined invoice" };

/**
 * A few of one client's own invoices, merged into a single billable
 * document — e.g. an institution that gets billed once for several separate
 * deliveries. Nothing here is stored: it is drawn fresh from the selected
 * invoices every time, so it can never disagree with them or double-count
 * Total sales the way saving it as a new invoice row would.
 */
export default async function CombinedInvoicePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids: idsParam } = await searchParams;
  const ids = [...new Set((idsParam ?? "").split(",").map((id) => id.trim()).filter(Boolean))];

  const problem = (message: string) => (
    <CmsPage title="Combined invoice" backHref="/factory/invoices">
      <p role="alert" className="text-sm text-accent-deep">{message}</p>
    </CmsPage>
  );

  if (ids.length < 2) return problem("Select at least two invoices from the same client to combine them.");

  const invoices = await getInvoicesByIds(ids);
  if (invoices.length !== ids.length) notFound();

  const clientId = invoices[0].client_id;
  if (!invoices.every((row) => row.client_id === clientId)) {
    return problem("These invoices belong to different clients and cannot be combined into one bill.");
  }
  if (invoices.some((row) => row.status === "void")) {
    return problem("A voided invoice cannot be included in a combined invoice.");
  }

  const sorted = [...invoices].sort((a, b) => a.issued_on.localeCompare(b.issued_on) || a.invoice_no - b.invoice_no);
  const items = sorted.flatMap((invoice) => invoice.items.map((item) => ({
    ...item,
    id: `${invoice.id}-${item.id}`,
    source: `${item.source} · ${invoiceNumber(invoice.invoice_no)}`,
  })));
  const reference = `Combined · ${sorted.length} invoices`;
  const combined = {
    client_name: sorted[0].client_name,
    client_address: sorted[0].client_address,
    client_phone: sorted[0].client_phone,
    issued_on: today(),
    items,
    total_amount: Number(invoiceTotal(items)),
    notes: `Combines ${sorted.map((invoice) => invoiceNumber(invoice.invoice_no)).join(", ")}.`,
    status: "issued" as const,
  };

  return (
    <CmsPage title="Combined invoice" eyebrow={combined.client_name} backHref="/factory/invoices" actions={<PrintButton />}>
      <div className="print-controls mb-5">
        <InvoiceShare invoice={combined} brand={invoiceBrand} reference={reference} title="Combined invoice" />
      </div>
      <InvoiceDocument invoice={combined} brand={invoiceBrand} reference={reference} title="Combined invoice" />
    </CmsPage>
  );
}
