import { notFound } from "next/navigation";
import { CmsPage } from "@/components/cms/cms-page";
import { InvoiceDocument } from "@/components/cms/documents";
import { InvoiceShare } from "@/components/cms/invoice-share";
import { PrintButton } from "@/components/cms/print-button";
import { ButtonLink } from "@/components/ui/button";
import { invoiceBrand } from "@/content/cms";
import { RecordAction } from "@/features/cms/record-action";
import { getInvoice } from "@/lib/cms";
import { invoiceNumber } from "@/lib/accounting-core";
export const metadata = { title: "Invoice" };
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  const reference = invoiceNumber(invoice.invoice_no);
  return <CmsPage title={reference} eyebrow={invoice.client_name} backHref="/factory/invoices" actions={<><PrintButton />{invoice.status === "issued" && <ButtonLink size="sm" href={`/factory/invoices/${id}/edit`}>Edit invoice</ButtonLink>}</>}>
    <div className="print-controls mb-5"><InvoiceShare invoice={invoice} brand={invoiceBrand} reference={reference} /></div>
    <InvoiceDocument invoice={invoice} reference={reference} />
    {/* Two different things: voiding keeps the numbered record, deleting
        removes it. Both are offered, worded so the difference is plain. */}
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {invoice.status === "issued" && <RecordAction url={`/api/cms/invoices/${id}`} label="Void invoice" method="PATCH" body={{ status: "void" }} confirmation="Void this invoice? It will be kept for your records and removed from Total sales. This cannot be undone." />}
      <RecordAction url={`/api/cms/invoices/${id}`} label="Delete invoice" confirmation={`Delete ${invoiceNumber(invoice.invoice_no)} completely? It disappears from your records and from Total sales. Stock it took out is not put back. Void it instead to keep the record. This cannot be undone.`} redirectTo="/factory/invoices" />
    </div>
  </CmsPage>;
}
