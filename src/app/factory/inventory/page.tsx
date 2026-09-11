import Image from "next/image";
import Link from "next/link";
import { Boxes, Plus } from "lucide-react";
import { CmsPage, EmptyState } from "@/components/cms/cms-page";
import { StatCard } from "@/components/cms/stat-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getInventory } from "@/lib/cms";
import { signedInventoryUrls } from "@/lib/inventory";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const [items, supabase] = await Promise.all([getInventory(), createSupabaseServerClient()]);
  const photos = supabase
    ? await signedInventoryUrls(supabase, items.flatMap((item) => (item.image_path ? [item.image_path] : [])))
    : {};

  const empty = items.filter((item) => item.quantity === 0);
  const pieces = items.reduce((count, item) => count + item.quantity, 0);

  return <CmsPage title="Inventory" eyebrow="Factory" actions={
    <ButtonLink href="/factory/inventory/new" size="sm"><Plus className="h-4 w-4" aria-hidden="true" />Add item</ButtonLink>
  }>
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      <StatCard label="Items" value={items.length} icon={<Boxes className="h-4 w-4" />} />
      <StatCard label="Pieces in stock" value={pieces} />
      <StatCard label="Out of stock" value={empty.length} tone={empty.length ? "accent" : "neutral"} hint={empty.length ? "Restock these" : "Nothing to restock"} />
    </div>

    {items.length ? (
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)]">
        <table className="document-table">
          <caption className="sr-only">Every inventory item and its stock on hand.</caption>
          <thead><tr>
            <th scope="col" aria-label="Serial number">S.No.</th>
            <th scope="col">Picture</th>
            <th scope="col">Code no.</th>
            <th scope="col">Item</th>
            <th scope="col" className="number">Quantity</th>
          </tr></thead>
          <tbody>
            {items.map((item) => {
              const out = item.quantity === 0;
              const photo = item.image_path ? photos[item.image_path] : undefined;
              return (
                <tr key={item.id}>
                  <td data-label="S.No." className="tabular-nums">{item.item_no}</td>
                  <td data-label="Picture">
                    {photo ? (
                      <span className="relative block h-14 w-14 overflow-hidden rounded-[var(--radius-ui)] bg-canvas-deep">
                        <Image src={photo} alt="" fill sizes="56px" className="object-cover" unoptimized />
                      </span>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td data-label="Code no."><span className="font-semibold tabular-nums">{item.code}</span></td>
                  <td data-label="Item">
                    <Link href={`/factory/inventory/${item.id}`} className="font-semibold text-accent">{item.name}</Link>
                    {item.note && <p className="mt-1 break-words text-xs text-muted">{item.note}</p>}
                  </td>
                  <td data-label="Quantity" className="number">
                    {/* Zero is the figure worth catching, so it is loud. */}
                    <span className={cn("font-bold tabular-nums", out && "text-accent")}>{item.quantity}</span>
                    {out && <p className="mt-1"><Badge tone="accent">Out of stock</Badge></p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <EmptyState icon={<Boxes className="h-8 w-8" aria-hidden="true" />}>
        No inventory items yet. Add your first item to start tracking stock.
      </EmptyState>
    )}
  </CmsPage>;
}
