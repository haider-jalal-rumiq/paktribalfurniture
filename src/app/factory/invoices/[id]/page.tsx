import { notFound } from "next/navigation";
import { CmsPage } from "@/components/cms/cms-page";
import { InvoiceDocument } from "@/components/cms/documents";
import { PrintButton } from "@/components/cms/print-button";
import { ButtonLink } from "@/components/ui/button";
import { RecordAction } from "@/features/cms/record-action";
import { getInvoice } from "@/lib/cms";
import { invoiceNumber } from "@/lib/accounting-core";
export const metadata = { title: "Invoice" };
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  return <CmsPage title={invoiceNumber(invoice.invoice_no)} eyebrow={invoice.client_name} backHref="/factory/invoices" actions={<><PrintButton />{invoice.status === "issued" && <ButtonLink size="sm" href={`/factory/invoices/${id}/edit`}>Edit invoice</ButtonLink>}</>}>
    <p className="print-controls mb-5 text-sm text-muted">Choose Save as PDF in the print window to download and share this invoice.</p>
    <InvoiceDocument invoice={invoice} reference={invoiceNumber(invoice.invoice_no)} />
    {invoice.status === "issued" && <RecordAction url={`/api/cms/invoices/${id}`} label="Void invoice" method="PATCH" body={{ status: "void" }} confirmation="Void this invoice? It will be kept for your records and removed from Total sales. This cannot be undone." />}
  </CmsPage>;
}
