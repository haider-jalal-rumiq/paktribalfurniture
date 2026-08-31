import { z } from "zod";

/**
 * One schema, imported by both the client form and the route handler, so
 * client and server validation cannot drift apart.
 */

export const APPOINTMENT_REASONS = [
  "New glasses",
  "Fill an existing prescription",
  "Repair or adjustment",
  "Sunglasses",
  "Native Visions eyewear",
  "Something else",
] as const;

export const PREFERRED_DAYS = [
  "Any weekday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export const PREFERRED_TIMES = [
  "Any time",
  "Morning (8am – 12pm)",
  "Afternoon (12pm – 5pm)",
] as const;

// Deliberately permissive: rejecting a real customer's unusual address is a
// worse failure than accepting an occasional bad one.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const appointmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(80, "That name is too long."),

  email: z
    .string()
    .trim()
    .min(1, "Please enter an email address.")
    .max(160, "That email address is too long.")
    .regex(EMAIL, "Please enter a valid email address."),

  phone: z
    .string()
    .trim()
    .min(1, "Please enter a phone number.")
    .refine(
      (value) => value.replace(/\D/g, "").length >= 10,
      "Please enter a 10-digit phone number.",
    ),

  reason: z.enum(APPOINTMENT_REASONS, {
    message: "Please tell us what you need.",
  }),

  preferredDay: z.enum(PREFERRED_DAYS),
  preferredTime: z.enum(PREFERRED_TIMES),

  message: z.string().trim().max(1000, "Please keep this under 1000 characters.").optional(),

  /** Honeypot. Real people never see this field, so anything in it is a bot. */
  website: z.string().max(0).optional(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export interface AppointmentResponse {
  success: boolean;
  message: string;
  /** Field-level messages, keyed by field name. */
  errors?: Record<string, string>;
}
