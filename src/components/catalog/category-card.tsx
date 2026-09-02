import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { categories } from "@/content/catalog";
import { cn } from "@/lib/utils";

type Category = (typeof categories)[number];

export function CategoryCard({ category, className, priority = false }: { category: Category; className?: string; priority?: boolean }) {
  return (
    <Link href={`/collections?category=${category.slug}`} className={cn("group relative block min-h-72 overflow-hidden bg-canvas-deep", className)}>
      <Image
        src={category.image}
        alt=""
        fill
        priority={priority}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.035]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/82 via-ink/8 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-7">
        <div>
          <h3 className="max-w-md font-display text-3xl leading-none">{category.name}</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">{category.description}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/45 transition-colors group-hover:bg-white group-hover:text-ink">
          <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
