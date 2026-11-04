/** A supplier is identified by name, so the name travels as an encoded query value. */
export function woodSupplierHref(name: string): string {
  return `/factory/expenses/wood/supplier?${new URLSearchParams({ name })}`;
}

/** Opens the wood entry form with the month and supplier already chosen. */
export function newWoodEntryHref({ month, purchaser, mode }: { month: string; purchaser: string; mode: "purchase" | "payment" }): string {
  return `/factory/expenses/wood/new?${new URLSearchParams({ month, purchaser, mode })}`;
}
