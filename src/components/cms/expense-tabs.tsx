import Link from "next/link";
import { cn } from "@/lib/utils";

export function ExpenseTabs({ active }: { active: "general" | "labour" }) {
  return <nav aria-label="Expense sheets" className="mb-6 flex gap-2 border-b border-hairline">
    {([{ key: "general", label: "General expenses", href: "/factory/expenses" }, { key: "labour", label: "Labour sheet", href: "/factory/expenses/labour" }] as const).map((tab) => <Link key={tab.key} href={tab.href} aria-current={active === tab.key ? "page" : undefined} className={cn("min-h-12 border-b-2 px-4 py-3 text-sm font-semibold", active === tab.key ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink")}>{tab.label}</Link>)}
  </nav>;
}
