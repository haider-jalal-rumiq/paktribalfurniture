import Link from "next/link";

import { cn } from "@/lib/utils";

export interface TabNavItem {
  key: string;
  label: string;
  href: string;
}

/** Underline tabs for switching between the sheets or views of one list. */
export function TabNav({ label, items, active, className = "mb-6" }: { label: string; items: readonly TabNavItem[]; active: string; className?: string }) {
  return <nav aria-label={label} className={cn("flex gap-2 border-b border-hairline", className)}>
    {items.map((item) => <Link key={item.key} href={item.href} aria-current={active === item.key ? "page" : undefined} className={cn("min-h-12 border-b-2 px-4 py-3 text-sm font-semibold", active === item.key ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink")}>{item.label}</Link>)}
  </nav>;
}
