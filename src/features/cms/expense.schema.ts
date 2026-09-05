import { z } from "zod";

import { expenseCategoryValues } from "@/content/cms";
import { amountField, dateField, oneOf, optionalText } from "@/features/cms/fields";

export const expenseInputSchema = z.object({
  spentOn: dateField("Enter the date"),
  category: oneOf(expenseCategoryValues, "Choose a category"),
  amount: amountField("Enter the amount in rupees"),
  note: optionalText(400),
  orderId: z.union([z.uuid(), z.literal("")]).optional(),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
