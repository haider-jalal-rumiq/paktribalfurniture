/**
 * Money is whole Pakistani rupees stored as integers. Paisa are not used in
 * this trade, and integers keep every sum exact.
 */

const grouped = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

export const MAX_AMOUNT = 999_999_999_999;

export function formatPkr(rupees: number): string {
  return `Rs ${grouped.format(Math.round(rupees))}`;
}

/** Short form for dashboard tiles: 250000 -> "Rs 2.5 lac", 12000000 -> "Rs 1.2 cr". */
export function formatPkrShort(rupees: number): string {
  const abs = Math.abs(rupees);
  if (abs >= 10_000_000) return `Rs ${(rupees / 10_000_000).toFixed(1).replace(/\.0$/, "")} cr`;
  if (abs >= 100_000) return `Rs ${(rupees / 100_000).toFixed(1).replace(/\.0$/, "")} lac`;
  return formatPkr(rupees);
}

/**
 * Reads an amount typed by a person: "250,000", "Rs 250000", " 250000 ".
 * Returns null for anything that is not a whole, non-negative rupee figure —
 * callers surface that as a validation error rather than silently coercing.
 */
export function parseAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 0 && value <= MAX_AMOUNT ? value : null;
  }
  if (typeof value !== "string") return null;

  const cleaned = value.replace(/[\s,]/g, "").replace(/^(rs\.?|pkr)/i, "");
  if (!/^\d+$/.test(cleaned)) return null;

  const parsed = Number(cleaned);
  return parsed <= MAX_AMOUNT ? parsed : null;
}
