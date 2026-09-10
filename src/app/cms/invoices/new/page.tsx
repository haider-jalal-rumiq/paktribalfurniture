import { CmsPage } from "@/components/cms/cms-page";
import { InvoiceForm } from "@/features/cms/invoice-form";
import { getClients } from "@/lib/cms";
export const metadata = { title: "New invoice" };
export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const [clients, params] = await Promise.all([getClients(), searchParams]);
  return <CmsPage title="New invoice" eyebrow="Sales" backHref="/cms/invoices"><InvoiceForm clients={clients} defaultClientId={params.client} /></CmsPage>;
}
