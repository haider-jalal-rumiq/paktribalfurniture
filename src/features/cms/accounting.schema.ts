import { z } from "zod";

import { amountField, dateField, optionalText } from "@/features/cms/fields";
import { invoiceTotal } from "@/lib/accounting-core";
import { MAX_AMOUNT } from "@/lib/money";

export const balanceInputSchema = z.object({
  id: z.uuid(),
  receivedOn: dateField("Enter a valid date"),
  amount: amountField("Enter the balance to add in whole rupees"),
  note: z.string().trim().min(2, "Describe this balance, for example opening balance").max(400),
});

export const invoiceItemSchema = z.object({
  id: z.uuid(),
  item: z.string().trim().min(1, "Enter an item name").max(200),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(10000),
  amount: amountField("Enter an item amount in whole rupees", { allowZero: true }),
  source: z.string().trim().min(1, "Enter stock or order").max(80),
});

export const invoiceInputSchema = z.object({
  id: z.uuid(),
  clientId: z.uuid("Choose a client"),
  issuedOn: dateField("Enter a valid invoice date"),
  notes: optionalText(2000),
  items: z.array(invoiceItemSchema).min(1, "Add at least one item").max(100),
}).refine((value) => {
  if (!value.items.every((item) => Number.isSafeInteger(item.amount) && Number.isSafeInteger(item.quantity))) return false;
  const total = invoiceTotal(value.items);
  return total > 0n && total <= BigInt(MAX_AMOUNT);
}, { message: "The invoice total must be between Rs 1 and Rs 999,999,999,999", path: ["items"] });

/**
 * A payslip's inputs. Total payable and balance are computed by labourTotals(),
 * never typed — so advance and salary paid are no longer checked against the
 * total here: a deduction can legitimately drop the total below what was
 * already handed over, and the sheet shows that as a negative balance.
 */
export const labourInputSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2, "Enter the worker's name").max(140),
  period: z.string().regex(/^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/, "Choose the salary month"),
  paidOn: dateField("Enter a valid payment date"),
  salary: amountField("Enter the salary in whole rupees", { allowZero: true }),
  perDaySalary: amountField("Enter the per-day salary in whole rupees", { allowZero: true }),
  otHours: z.coerce.number().int().min(0, "Overtime cannot be negative").max(1000, "That is too many hours"),
  otRate: amountField("Enter the overtime rate per hour in whole rupees", { allowZero: true }),
  deduction: amountField("Enter any other deduction in whole rupees", { allowZero: true }),
  advance: amountField("Enter the advance in whole rupees", { allowZero: true }),
  salaryPaid: amountField("Enter salary paid in whole rupees", { allowZero: true }),
  leaves: z.coerce.number().int().min(0).max(31),
  notes: optionalText(1000),
});
