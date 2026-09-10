/** Whole-rupee calculations stay exact even when all-time totals exceed JS's safe integer. */
export function sumRupees(rows: readonly { amount: number }[]): bigint {
  return rows.reduce((sum, row) => sum + BigInt(row.amount), 0n);
}

export function invoiceTotal(items: readonly { amount: number; quantity: number }[]): bigint {
  return items.reduce((sum, item) => sum + BigInt(item.amount) * BigInt(item.quantity), 0n);
}

export function labourAmounts(entry: { total_amount: number; advance: number; salary_paid: number }) {
  const paid = BigInt(entry.advance) + BigInt(entry.salary_paid);
  return { paid, balance: BigInt(entry.total_amount) - paid };
}

export function availableCredit(added: bigint, expenses: bigint, labourPaid: bigint): bigint {
  return added - expenses - labourPaid;
}

export const showDate = (value: string): string =>
  new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));

export const invoiceNumber = (number: number): string => `PTF-${String(number).padStart(4, "0")}`;
