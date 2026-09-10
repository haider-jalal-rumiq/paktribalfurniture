/**
 * Business CMS vocabulary. The SQL CHECK constraints in supabase/cms-schema.sql
 * mirror fixed client/status lists by hand. Expense labels are legacy display
 * mappings; new expense categories are user-entered text.
 */

export const clientTypes = [
  { value: "individual", label: "Individual customer", short: "Individual" },
  { value: "showroom", label: "Showroom", short: "Showroom" },
  { value: "factory", label: "Factory client", short: "Factory" },
  { value: "institution", label: "Institution", short: "Institution" },
] as const;

export const orderStatuses = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

/** Statuses that still expect a delivery, so they drive reminders and balances. */
export const openOrderStatuses = ["pending", "in_progress", "ready"] as const;

export const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank transfer" },
  { value: "easypaisa", label: "Easypaisa" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
] as const;

export const expenseCategories = [
  { value: "material", label: "Material" },
  { value: "labor", label: "Labour" },
  { value: "daily_wages", label: "Daily payments" },
  { value: "hardware", label: "Hardware" },
  { value: "polish", label: "Polish" },
  { value: "kitchen", label: "Kitchen" },
  { value: "misc", label: "Miscellaneous" },
  { value: "other", label: "Other" },
] as const;

export type ClientType = (typeof clientTypes)[number]["value"];
export type OrderStatus = (typeof orderStatuses)[number]["value"];
export type PaymentMethod = (typeof paymentMethods)[number]["value"];
export type ExpenseCategory = string;

type Option = { readonly value: string; readonly label: string };

const labelOf = (options: readonly Option[], value: string): string =>
  options.find((option) => option.value === value)?.label ?? value;

export const clientTypeLabel = (value: string): string => labelOf(clientTypes, value);

/** Badge-sized label — the full one crowds out the client's name on a phone. */
export const clientTypeShort = (value: string): string =>
  clientTypes.find((type) => type.value === value)?.short ?? value;
export const orderStatusLabel = (value: string): string => labelOf(orderStatuses, value);
export const paymentMethodLabel = (value: string): string => labelOf(paymentMethods, value);
export const expenseCategoryLabel = (value: string): string => labelOf(expenseCategories, value);

export const clientTypeValues: readonly string[] = clientTypes.map((type) => type.value);
export const orderStatusValues: readonly string[] = orderStatuses.map((status) => status.value);
export const paymentMethodValues: readonly string[] = paymentMethods.map((method) => method.value);
export const expenseCategoryValues: readonly string[] = expenseCategories.map((category) => category.value);

/** Legacy category labels remain readable; new expenses accept any category. */
export const labourExpenseLabel = "Labour payments";

/**
 * Trading names on printed documents. `lines` is the stacked lockup in the
 * document header; the CSS gives the last line the smaller treatment.
 * /cms bills the factory work, /shop bills the showroom counter.
 */
export const invoiceBrand = { name: "WOODONA HERITAGE", lines: ["WOODONA", "HERITAGE"] } as const;
export const shopBrand = { name: "PAK TRIBAL FURNITURE", lines: ["PAK TRIBAL", "FURNITURE"] } as const;

/** The two shop partners split net profit. Shares must add up to 100. */
export const partnerShares = { minor: 30, major: 70 } as const;
