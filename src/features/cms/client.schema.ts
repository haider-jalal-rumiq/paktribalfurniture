import { z } from "zod";

import { clientTypeValues } from "@/content/cms";
import { oneOf, optionalPhone, optionalText } from "@/features/cms/fields";

export const clientInputSchema = z.object({
  name: z.string().trim().min(2, "Enter the client name").max(140),
  type: oneOf(clientTypeValues, "Choose a client type"),
  phone: optionalPhone(),
  address: optionalText(400),
  notes: optionalText(2000),
});

export type ClientInput = z.infer<typeof clientInputSchema>;
