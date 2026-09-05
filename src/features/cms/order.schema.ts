import { z } from "zod";

import { orderStatusValues } from "@/content/cms";
import {
  amountField,
  dateField,
  oneOf,
  optionalDateField,
  optionalPhone,
  optionalText,
} from "@/features/cms/fields";

export const orderInputSchema = z.object({
  clientId: z.uuid("Choose a client"),
  siteLabel: optionalText(80),
  title: z.string().trim().min(2, "Describe what is being made").max(200),
  description: z.string().trim().max(4000),
  deliveryAddress: optionalText(400),
  contactPhone: optionalPhone(),
  totalAmount: amountField("Enter the order total in rupees", { allowZero: true }),
  orderDate: dateField("Enter the order date"),
  expectedDate: optionalDateField(),
  status: oneOf(orderStatusValues, "Choose a status"),
  notes: optionalText(4000),
  existingImagePaths: z.array(z.string().max(400)).max(12),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
