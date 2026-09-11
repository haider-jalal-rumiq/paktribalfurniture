import { CmsPage } from "@/components/cms/cms-page";
import { InventoryForm } from "@/features/cms/inventory-form";
export const metadata = { title: "Add item" };
export default function NewInventoryItemPage() {
  return <CmsPage title="Add item" eyebrow="Inventory" backHref="/factory/inventory"><InventoryForm /></CmsPage>;
}
