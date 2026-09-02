import Link from "next/link";

import { categories } from "@/content/catalog";
import { cn } from "@/lib/utils";

export function CategoryFilters({ active }: { active?: string }) {
  return (
    <nav aria-label="Filter products by category" className="overflow-x-auto pb-2">
      <ul className="flex min-w-max gap-2">
        <li><Link href="/collections" className={cn("inline-flex min-h-11 items-center border px-4 text-sm font-semibold transition-colors", !active ? "border-ink bg-ink text-canvas" : "border-hairline text-ink-soft hover:border-ink")}>All pieces</Link></li>
        {categories.map((category) => (
          <li key={category.slug}>
            <Link href={`/collections?category=${category.slug}`} aria-current={active === category.slug ? "page" : undefined} className={cn("inline-flex min-h-11 items-center border px-4 text-sm font-semibold transition-colors", active === category.slug ? "border-ink bg-ink text-canvas" : "border-hairline text-ink-soft hover:border-ink")}>
              {category.shortName}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
