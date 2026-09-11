import { notFound } from "next/navigation";
import { CmsPage } from "@/components/cms/cms-page";
import { InventoryForm } from "@/features/cms/inventory-form";
import { getInventoryItem } from "@/lib/cms";
import { signedInventoryUrls } from "@/lib/inventory";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const metadata = { title: "Inventory item" };

export default async function InventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, supabase] = await Promise.all([getInventoryItem(id), createSupabaseServerClient()]);
  if (!item) notFound();
  const photos = supabase && item.image_path ? await signedInventoryUrls(supabase, [item.image_path]) : {};
  return <CmsPage title={item.name} eyebrow={`Code ${item.code}`} backHref="/factory/inventory">
    <InventoryForm item={item} photo={item.image_path ? photos[item.image_path] : undefined} />
  </CmsPage>;
}
