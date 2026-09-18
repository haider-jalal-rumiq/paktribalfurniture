import { CmsPage } from "@/components/cms/cms-page";
import { InventoryForm } from "@/features/cms/inventory-form";
import { getInventory } from "@/lib/cms";
export const metadata = { title: "Add item" };
export default async function NewInventoryItemPage() {
  // Existing names, so a new item reuses the wording already in the stock list.
  const names = [...new Set((await getInventory() ?? []).map((row) => row.name))].sort();
  return <CmsPage title="Add item" eyebrow="Inventory" backHref="/factory/inventory"><InventoryForm names={names} /></CmsPage>;
}
