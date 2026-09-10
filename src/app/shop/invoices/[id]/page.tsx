import { notFound } from "next/navigation";

import { CmsPage } from "@/components/cms/cms-page";
import { InvoiceDocument } from "@/components/cms/documents";
import { PrintButton } from "@/components/cms/print-button";
import { shopBrand } from "@/content/cms";
import { RecordAction } from "@/features/cms/record-action";
import { shopInvoiceNumber } from "@/lib/accounting-core";
import { getShopInvoice } from "@/lib/cms";

export const metadata = { title: "Invoice" };

export default async function ShopInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getShopInvoice(id);
  if (!invoice) notFound();

  const reference = shopInvoiceNumber(invoice.invoice_no);

  return (
    <CmsPage title={reference} eyebrow={invoice.customer_name} backHref="/shop/invoices" actions={<PrintButton />}>
      <p className="print-controls mb-5 text-sm text-muted">
        Choose Save as PDF in the print window to download and share this invoice.
      </p>
      <InvoiceDocument
        brand={shopBrand}
        reference={reference}
        invoice={{
          client_name: invoice.customer_name,
          client_address: invoice.customer_address,
          client_phone: invoice.customer_phone,
          issued_on: invoice.issued_on,
          items: invoice.items,
          total_amount: invoice.total_amount,
          notes: invoice.notes,
          status: invoice.status,
        }}
      />
      {invoice.status === "issued" && (
        <RecordAction
          url={`/api/shop/invoices/${id}`}
          label="Void invoice"
          method="PATCH"
          body={{ status: "void" }}
          confirmation="Void this invoice? It will be kept for your records and removed from the invoice total. This cannot be undone."
        />
      )}
    </CmsPage>
  );
}
