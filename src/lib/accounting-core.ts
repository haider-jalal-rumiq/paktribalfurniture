/** Whole-rupee calculations stay exact even when all-time totals exceed JS's safe integer. */
export function sumRupees(rows: readonly { amount: number }[]): bigint {
  return rows.reduce((sum, row) => sum + BigInt(row.amount), 0n);
}

export function invoiceTotal(items: readonly { amount: number; quantity: number }[]): bigint {
  return items.reduce((sum, item) => sum + BigInt(item.amount) * BigInt(item.quantity), 0n);
}

export function availableCredit(added: bigint, expenses: bigint, labourPaid: bigint, woodPaid = 0n): bigint {
  return added - expenses - labourPaid - woodPaid;
}

/** Purchases create the payable; only payments spend cash. */
export function woodTotals(rows: readonly { purchased_amount: number; paid_amount: number }[]) {
  const purchased = rows.reduce((sum, row) => sum + BigInt(row.purchased_amount), 0n);
  const paid = rows.reduce((sum, row) => sum + BigInt(row.paid_amount), 0n);
  return { purchased, paid, remaining: purchased - paid };
}

/** Group every purchase and payment into its purchaser's running account. */
export function woodAccounts<T extends { id: string; purchaser_name: string; purchased_amount: number; paid_amount: number }>(rows: readonly T[]) {
  const accounts = new Map<string, { id: string; name: string; purchased: bigint; paid: bigint; remaining: bigint; entries: T[] }>();
  for (const entry of rows) {
    const id = entry.purchaser_name.trim().toLocaleLowerCase("en");
    const account = accounts.get(id) ?? { id, name: entry.purchaser_name.trim(), purchased: 0n, paid: 0n, remaining: 0n, entries: [] };
    account.purchased += BigInt(entry.purchased_amount);
    account.paid += BigInt(entry.paid_amount);
    account.remaining = account.purchased - account.paid;
    account.entries.push(entry);
    accounts.set(id, account);
  }
  return [...accounts.values()];
}

export const showDate = (value: string): string =>
  new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));

export const invoiceNumber = (number: number): string => `PTF-${String(number).padStart(4, "0")}`;

/**
 * A shop sale row. `sale_price` is per unit and is the truth: for an
 * invoice-drafted row it comes from the invoice, for a manual row the form
 * computed it with manualSalePrice() before saving. `cost` is null while the
 * row is still a draft, so profit is unknown rather than zero.
 */
export function shopSaleAmounts(row: { quantity: number; sale_price: number; cost: number | null }) {
  const quantity = BigInt(row.quantity);
  const unit = BigInt(row.sale_price);
  const sale = unit * quantity;
  const cost = row.cost === null ? null : BigInt(row.cost) * quantity;
  return { quantity, unit, sale, cost, profit: cost === null ? null : sale - cost };
}

/**
 * Manual pricing: add the margin to the purchase price, then take the discount
 * off the marked price. Rs 10,000 at 40% is marked Rs 14,000; a 5% discount
 * sells it for Rs 13,300. Integer arithmetic, mirrored by the SQL CHECK.
 */
export function manualSalePrice(cost: number, marginPct: number, discountPct: number) {
  const base = BigInt(cost);
  const marked = base + (base * BigInt(marginPct) + 50n) / 100n;
  const discount = (marked * BigInt(discountPct) + 50n) / 100n;
  return { marked, discount, salePrice: marked - discount };
}

/** Margin actually achieved on a row, once the purchase price is known. */
export function achievedMarginPct(sale: bigint, cost: bigint | null): number | null {
  if (cost === null || cost === 0n) return null;
  return Number(((sale - cost) * 100n) / cost);
}

export type ShopRow = {
  quantity: number;
  sale_price: number;
  cost: number | null;
  returned_on: string | null;
};

/**
 * Returned items leave sales and profit. A draft row (no purchase price yet)
 * counts towards sales but not profit — otherwise the split would silently
 * treat an unpriced item as pure profit.
 */
export function shopTotals(rows: readonly ShopRow[]) {
  const totals = { sold: 0, sales: 0n, profit: 0n, drafts: 0, returned: 0, returnedSales: 0n };
  for (const row of rows) {
    const { sale, profit } = shopSaleAmounts(row);
    if (row.returned_on) {
      totals.returned += 1;
      totals.returnedSales += sale;
      continue;
    }
    totals.sold += 1;
    totals.sales += sale;
    if (profit === null) totals.drafts += 1;
    else totals.profit += profit;
  }
  return totals;
}

/** Invoice discount is a percentage of the line subtotal, in whole rupees. */
export function invoiceDiscount(subtotal: bigint, discountPct: number) {
  const discount = (subtotal * BigInt(discountPct) + 50n) / 100n;
  return { discount, total: subtotal - discount };
}

/**
 * Labour payslip. Regular pay depends on the worker's agreed basis: monthly
 * salary, days worked (with optional item work), or items completed. Overtime
 * applies to every basis.
 * Everything is derived, so the sheet cannot disagree with its inputs.
 * Total may go negative when deductions exceed earnings — that is a real
 * over-deduction and is shown rather than clamped.
 */
export function labourTotals(entry: {
  pay_basis: "monthly" | "daily" | "per_item"; salary: number;
  per_day_salary: number; days_worked: number; item_count: number; item_rate: number;
  ot_hours: number; ot_rate: number; deduction: number; leaves: number;
  leave_deduction: number;
  advance: number; salary_paid: number;
}) {
  const dailyPay = entry.pay_basis === "daily"
    ? BigInt(entry.days_worked) * BigInt(entry.per_day_salary)
    : 0n;
  // A daily worker's item payment is the lump sum written down; the item count
  // beside it only records how much work that covered, so it is NOT a rate to
  // multiply. A per-item worker genuinely earns a rate for each item completed.
  const itemPay = entry.pay_basis === "daily"
    ? BigInt(entry.item_rate)
    : entry.pay_basis === "per_item"
      ? BigInt(entry.item_count) * BigInt(entry.item_rate)
      : 0n;
  const regularPay = entry.pay_basis === "monthly" ? BigInt(entry.salary) : dailyPay + itemPay;
  const leaveDeduction = BigInt(entry.leave_deduction);
  const overtime = BigInt(entry.ot_hours) * BigInt(entry.ot_rate);
  const total = regularPay + overtime - leaveDeduction - BigInt(entry.deduction);
  const paid = BigInt(entry.advance) + BigInt(entry.salary_paid);
  return { regularPay, dailyPay, itemPay, leaveDeduction, overtime, total, paid, balance: total - paid };
}

/** Two partners. The minor share truncates so the pair always sums to `net`. */
export function partnerSplit(net: bigint, minorPercent: bigint) {
  const minor = (net * minorPercent) / 100n;
  return { minor, major: net - minor };
}

export const shopInvoiceNumber = (number: number): string => `PTFS-${String(number).padStart(4, "0")}`;
