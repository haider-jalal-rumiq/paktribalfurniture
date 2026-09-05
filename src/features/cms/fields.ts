import { z } from "zod";

import { parseAmount } from "@/lib/money";

/** Empty strings from a form mean "not provided", never a validation failure. */
export const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const optionalPhone = () =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || (value.length >= 7 && value.length <= 30), "Enter a valid phone number")
    .optional()
    .or(z.literal(""));

/** A person types "250,000" or "Rs 250000"; the column stores whole rupees. */
export const amountField = (message: string, { allowZero = false } = {}) =>
  z.union([z.string(), z.number()]).transform((value, ctx) => {
    const parsed = parseAmount(value);
    if (parsed === null || (!allowZero && parsed === 0)) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return parsed;
  });

export const dateField = (message: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message);

export const optionalDateField = () =>
  z
    .string()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date")
    .optional()
    .or(z.literal(""));

export const oneOf = (values: readonly string[], message: string) =>
  z.string().refine((value) => values.includes(value), message);

/** Turns "" into null so an optional column stores NULL rather than an empty string. */
export const orNull = (value: string | undefined): string | null => (value?.trim() ? value.trim() : null);
