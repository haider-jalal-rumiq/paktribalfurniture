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

/**
 * Shop counter sale. Cost is what the shop paid; the marked price adds the
 * margin; the discount comes off the marked price.
 *   10,000 cost + 40% -> 14,000 marked - 500 discount = 13,500 sale, 3,500 profit
 * Integer arithmetic throughout, mirrored by shop_sales_discount_check in
 * supabase/shop-schema.sql so the database can never hold a negative sale.
 */
export function shopSaleAmounts(sale: { cost: number; margin_pct: number; discount: number }) {
  const cost = BigInt(sale.cost);
  const marked = cost + (cost * BigInt(sale.margin_pct) + 50n) / 100n;
  const total = marked - BigInt(sale.discount);
  return { cost, marked, discount: BigInt(sale.discount), sale: total, profit: total - cost };
}

export type ShopRow = { cost: number; margin_pct: number; discount: number; returned_on: string | null };

/** Returned items leave sales and profit and are reported on their own line. */
export function shopTotals(rows: readonly ShopRow[]) {
  const totals = { sold: 0, sales: 0n, profit: 0n, returned: 0, returnedSales: 0n };
  for (const row of rows) {
    const { sale, profit } = shopSaleAmounts(row);
    if (row.returned_on) {
      totals.returned += 1;
      totals.returnedSales += sale;
    } else {
      totals.sold += 1;
      totals.sales += sale;
      totals.profit += profit;
    }
  }
  return totals;
}

/** Two partners. The minor share truncates so the pair always sums to `net`. */
export function partnerSplit(net: bigint, minorPercent: bigint) {
  const minor = (net * minorPercent) / 100n;
  return { minor, major: net - minor };
}

export const shopInvoiceNumber = (number: number): string => `PTFS-${String(number).padStart(4, "0")}`;
