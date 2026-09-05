import { z } from "zod";

import { paymentMethodValues } from "@/content/cms";
import { amountField, dateField, oneOf, optionalText } from "@/features/cms/fields";

export const paymentInputSchema = z.object({
  amount: amountField("Enter the amount received in rupees"),
  paidOn: dateField("Enter the date received"),
  method: oneOf(paymentMethodValues, "Choose how it was paid"),
  note: optionalText(400),
});

export type PaymentInput = z.infer<typeof paymentInputSchema>;
