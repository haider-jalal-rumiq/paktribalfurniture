import { TabNav } from "@/components/cms/tab-nav";

export function ExpenseTabs({ active }: { active: "general" | "labour" | "wood" }) {
  return <TabNav
    label="Expense sheets"
    active={active}
    items={[
      { key: "general", label: "General expenses", href: "/factory/expenses" },
      { key: "labour", label: "Labour sheet", href: "/factory/expenses/labour" },
      { key: "wood", label: "Wood sheet", href: "/factory/expenses/wood" },
    ]}
  />;
}
