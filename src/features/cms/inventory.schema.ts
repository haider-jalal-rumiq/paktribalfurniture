import { z } from "zod";
import { optionalText } from "@/features/cms/fields";

export const inventoryInputSchema = z.object({
  code: z.string().trim().min(1, "Enter a code number").max(40),
  name: z.string().trim().min(1, "Enter the item name").max(200),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative").max(1_000_000, "That is too many"),
  note: optionalText(400),
  /** Ticked on edit to drop the existing photo without uploading a new one. */
  removeImage: z.union([z.string(), z.boolean()]).optional()
    .transform((value) => value === true || value === "on" || value === "true"),
});
