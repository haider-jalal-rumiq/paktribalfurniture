import { z } from "zod";

import { amountField, dateField, optionalPhone, optionalText } from "@/features/cms/fields";
import { invoiceItemSchema } from "@/features/cms/accounting.schema";
import { invoiceTotal } from "@/lib/accounting-core";
import { MAX_AMOUNT } from "@/lib/money";

/**
 * A manually priced counter sale. The form turns cost + margin + discount into
 * the stored per-unit sale_price with manualSalePrice(); margin and discount
 * are kept alongside it as a record of how the price was reached.
 */
export const shopSaleInputSchema = z.object({
  soldOn: dateField("Enter a valid sale date"),
  name: z.string().trim().min(1, "Enter the stock name").max(200),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(10000),
  cost: amountField("Enter the purchase price in whole rupees", { allowZero: true }),
  marginPct: z.coerce.number().int().min(0, "Margin cannot be negative").max(1000, "Margin is too large"),
  discountPct: z.coerce.number().int().min(0, "Discount cannot be negative").max(100, "A discount cannot exceed 100%"),
  note: optionalText(400),
});

/** Filling in the purchase price on a draft row is the only edit it accepts. */
export const shopSaleCostSchema = z.object({
  cost: amountField("Enter the purchase price in whole rupees", { allowZero: true }),
});

export const shopInvoiceInputSchema = z.object({
  id: z.uuid(),
  customerName: z.string().trim().min(2, "Enter the customer's name").max(140),
  customerPhone: optionalPhone(),
  customerAddress: optionalText(400),
  issuedOn: dateField("Enter a valid invoice date"),
  discountPct: z.coerce.number().int().min(0, "Discount cannot be negative").max(100, "A discount cannot exceed 100%"),
  notes: optionalText(2000),
  items: z.array(invoiceItemSchema).min(1, "Add at least one item").max(100),
}).refine((value) => {
  if (!value.items.every((item) => Number.isSafeInteger(item.amount) && Number.isSafeInteger(item.quantity))) return false;
  const total = invoiceTotal(value.items);
  return total > 0n && total <= BigInt(MAX_AMOUNT);
}, { message: "The invoice total must be between Rs 1 and Rs 999,999,999,999", path: ["items"] });
