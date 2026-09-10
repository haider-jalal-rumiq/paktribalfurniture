import { notFound } from "next/navigation";
import { CmsPage } from "@/components/cms/cms-page";
import { InvoiceForm } from "@/features/cms/invoice-form";
import { getClients, getInvoice } from "@/lib/cms";
import { invoiceNumber } from "@/lib/accounting-core";
export const metadata = { title: "Edit invoice" };
export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, clients] = await Promise.all([getInvoice(id), getClients()]);
  if (!invoice || invoice.status === "void") notFound();
  return <CmsPage title={`Edit ${invoiceNumber(invoice.invoice_no)}`} backHref={`/cms/invoices/${id}`}><InvoiceForm invoice={invoice} clients={clients} /></CmsPage>;
}
