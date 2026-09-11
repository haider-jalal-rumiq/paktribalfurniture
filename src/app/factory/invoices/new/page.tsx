import { CmsPage } from "@/components/cms/cms-page";
import { InvoiceForm } from "@/features/cms/invoice-form";
import { getClients, getInventory } from "@/lib/cms";
export const metadata = { title: "New invoice" };
export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const [clients, stock, params] = await Promise.all([getClients(), getInventory(), searchParams]);
  return <CmsPage title="New invoice" eyebrow="Sales" backHref="/factory/invoices"><InvoiceForm clients={clients} stock={stock ?? []} defaultClientId={params.client} /></CmsPage>;
}
