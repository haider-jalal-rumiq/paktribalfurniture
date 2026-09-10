import { z } from "zod";

import { orderStatusValues } from "@/content/cms";
import {
  dateField,
  oneOf,
  optionalDateField,
  optionalPhone,
  optionalText,
} from "@/features/cms/fields";

export const orderItemSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, "Enter an item name").max(200),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(10000),
  status: oneOf(orderStatusValues, "Choose an item status"),
  notes: z.string().trim().max(1000),
});

export const orderInputSchema = z.object({
  clientId: z.uuid("Choose a client"),
  siteLabel: optionalText(80),
  title: z.string().trim().min(2, "Describe what is being made").max(200),
  description: z.string().trim().max(4000),
  deliveryAddress: optionalText(400),
  contactPhone: optionalPhone(),
  items: z.array(orderItemSchema).max(100),
  orderDate: dateField("Enter the order date"),
  expectedDate: optionalDateField(),
  status: oneOf(orderStatusValues, "Choose a status"),
  notes: optionalText(4000),
  existingImagePaths: z.array(z.string().max(400)).max(12),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
