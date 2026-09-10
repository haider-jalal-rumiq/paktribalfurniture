import { z } from "zod";

import { amountField, dateField, optionalText } from "@/features/cms/fields";

export const expenseInputSchema = z.object({
  spentOn: dateField("Enter the date"),
  category: z.string().trim().min(1, "Enter a category").max(80),
  amount: amountField("Enter the amount in rupees"),
  note: optionalText(400),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
