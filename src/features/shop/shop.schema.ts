import { z } from "zod";

import { amountField, dateField, optionalPhone, optionalText } from "@/features/cms/fields";
import { invoiceItemSchema } from "@/features/cms/accounting.schema";
import { invoiceTotal, shopSaleAmounts } from "@/lib/accounting-core";
import { MAX_AMOUNT } from "@/lib/money";

/**
 * One counter sale. Cost, margin and discount are the only stored figures —
 * marked price, sale and profit are derived by shopSaleAmounts() so the ledger
 * cannot hold a total that disagrees with its own inputs.
 */
export const shopSaleInputSchema = z.object({
  soldOn: dateField("Enter a valid sale date"),
  name: z.string().trim().min(1, "Enter the stock name").max(200),
  cost: amountField("Enter the purchase price in whole rupees", { allowZero: true }),
  marginPct: z.coerce.number().int().min(0, "Margin cannot be negative").max(1000, "Margin is too large"),
  discount: amountField("Enter the discount in whole rupees", { allowZero: true }),
  note: optionalText(400),
}).refine(
  (value) => shopSaleAmounts({ cost: value.cost, margin_pct: value.marginPct, discount: value.discount }).sale >= 0n,
  { message: "The discount is larger than the marked price", path: ["discount"] },
);

export const shopInvoiceInputSchema = z.object({
  id: z.uuid(),
  customerName: z.string().trim().min(2, "Enter the customer's name").max(140),
  customerPhone: optionalPhone(),
  customerAddress: optionalText(400),
  issuedOn: dateField("Enter a valid invoice date"),
  notes: optionalText(2000),
  items: z.array(invoiceItemSchema).min(1, "Add at least one item").max(100),
}).refine((value) => {
  if (!value.items.every((item) => Number.isSafeInteger(item.amount) && Number.isSafeInteger(item.quantity))) return false;
  const total = invoiceTotal(value.items);
  return total > 0n && total <= BigInt(MAX_AMOUNT);
}, { message: "The invoice total must be between Rs 1 and Rs 999,999,999,999", path: ["items"] });
