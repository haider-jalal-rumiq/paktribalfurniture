import { CmsPage } from "@/components/cms/cms-page";
import { ShopInvoiceForm } from "@/features/shop/shop-invoice-form";
import { getShopSales } from "@/lib/cms";

export const metadata = { title: "New invoice" };

export default async function NewShopInvoicePage() {
  // Only items still with the customer can be billed; a return is not a sale.
  const stock = (await getShopSales()).filter((sale) => !sale.returned_on);
  return (
    <CmsPage title="New invoice" eyebrow="Pak Tribal Furniture" backHref="/shop/invoices">
      <ShopInvoiceForm stock={stock} />
    </CmsPage>
  );
}
