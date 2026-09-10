/**
 * Pure CMS logic — no Supabase, no "server-only", so client components and the
 * self-check in scripts/cms-check.mjs can both use it. src/lib/cms.ts re-exports
 * everything here, so server code only needs the one import.
 */

export interface Balance {
  total: number;
  paid: number;
  balance: number;
}

/** Legacy record calculation only. Active orders no longer carry payments. */
export function orderBalance(order: {
  total_amount: number;
  order_payments?: { amount: number }[] | null;
}): Balance {
  const paid = (order.order_payments ?? []).reduce((sum, payment) => sum + payment.amount, 0);
  return { total: order.total_amount, paid, balance: order.total_amount - paid };
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * "Today" in Pakistan, not in the server's timezone. Vercel runs in UTC, so a
 * plain new Date() rolls the date over at 5am Karachi time and makes an order
 * look a day less urgent than it is.
 */
const pkDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" });

export function today(): string {
  return pkDate.format(new Date());
}

export function currentMonth(): string {
  return today().slice(0, 7);
}

export function addDays(date: string, days: number): string {
  return isoDate(new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000));
}

/** Whole days from today to `date`. Negative means overdue. */
export function daysUntil(date: string): number {
  return Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today()}T00:00:00Z`)) / 86_400_000,
  );
}

/** "2026-09" -> the half-open range [2026-09-01, 2026-10-01). */
export function monthRange(month: string): { start: string; end: string } {
  const [year, index] = month.split("-").map(Number);
  return {
    start: isoDate(new Date(Date.UTC(year, index - 1, 1))),
    end: isoDate(new Date(Date.UTC(year, index, 1))),
  };
}

export function shiftMonth(month: string, by: number): string {
  const [year, index] = month.split("-").map(Number);
  return new Date(Date.UTC(year, index - 1 + by, 1)).toISOString().slice(0, 7);
}

export function monthLabel(month: string): string {
  const [year, index] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PK", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, index - 1, 1)),
  );
}

export function summariseExpenses(
  expenses: { category: string; amount: number }[],
): { total: number; byCategory: Record<string, number> } {
  const byCategory: Record<string, number> = Object.create(null);
  let total = 0;
  for (const expense of expenses) {
    byCategory[expense.category] = (byCategory[expense.category] ?? 0) + expense.amount;
    total += expense.amount;
  }
  return { total, byCategory: { ...byCategory } };
}
