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

/**
 * An amount a person may leave blank. Blank means zero rather than a
 * validation error — the field is genuinely optional, but anything actually
 * typed must still be a whole rupee figure.
 */
export const optionalAmountField = (message: string) =>
  z.union([z.string(), z.number()]).optional().transform((value, ctx) => {
    if (value === undefined || (typeof value === "string" && value.trim() === "")) return 0;
    const parsed = parseAmount(value);
    if (parsed === null) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return parsed;
  });

/**
 * An unticked checkbox is absent from FormData, not "false" — so a missing key
 * is the off state. Written explicitly rather than with z.coerce.boolean(),
 * which would read the string "false" as true.
 */
export const checkboxField = () =>
  z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "on" || value === "true");

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01" || value > "9999-12-31") return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const dateField = (message: string) => z.string().refine(isCalendarDate, message);

export const optionalDateField = () =>
  z
    .string()
    .refine((value) => value === "" || isCalendarDate(value), "Enter a valid date")
    .optional()
    .or(z.literal(""));

export const oneOf = (values: readonly string[], message: string) =>
  z.string().refine((value) => values.includes(value), message);

/** Turns "" into null so an optional column stores NULL rather than an empty string. */
export const orNull = (value: string | undefined): string | null => (value?.trim() ? value.trim() : null);
