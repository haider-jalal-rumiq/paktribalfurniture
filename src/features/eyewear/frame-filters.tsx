"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FRAME_CATEGORIES } from "@/features/eyewear/frames";
import { cn } from "@/lib/utils";

/**
 * Filters are links, not buttons — the active filter lives in the URL, so a
 * filtered view is shareable, indexable and survives the back button.
 */
export function FrameFilters({ active }: { active: string }) {
  const pathname = usePathname();
  const options = ["All", ...FRAME_CATEGORIES] as const;

  return (
    <nav aria-label="Filter frames by category">
      <ul className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option === active;
          return (
            <li key={option}>
              <Link
                href={
                  option === "All"
                    ? pathname
                    : `${pathname}?category=${encodeURIComponent(option)}`
                }
                scroll={false}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "inline-flex rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200",
                  selected
                    ? "border-ink bg-ink text-canvas"
                    : "border-hairline bg-surface text-ink-soft hover:border-ink/40 hover:text-ink",
                )}
              >
                {option}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
