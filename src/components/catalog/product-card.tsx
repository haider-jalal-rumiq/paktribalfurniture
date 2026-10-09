import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { getCategory } from "@/content/catalog";
import type { Product } from "@/types/database";

export function ProductCard({ product }: { product: Product }) {
  const category = getCategory(product.category_slug);
  const image = product.image_urls[0] ?? category?.image ?? "/images/furniture/workshop.jpg";
  return (
    <Link href={`/collections/${product.slug}`} className="group block" data-catalog-card="product">
      <div className="relative aspect-[4/5] overflow-hidden bg-canvas-deep">
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"
          className="catalog-card-image object-cover"
        />
        <div className="catalog-card-wash absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" aria-hidden="true" />
        {product.featured && <span className="absolute left-4 top-4 bg-surface px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ink">Featured</span>}
      </div>
      <div className="flex items-start justify-between gap-4 border-b border-hairline py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{category?.shortName ?? "Furniture"}</p>
          <h3 className="mt-1 font-display text-2xl text-ink">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-soft">{product.short_description}</p>
        </div>
        <ArrowUpRight className="catalog-card-arrow mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
      </div>
    </Link>
  );
}
