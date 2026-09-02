import { z } from "zod";

import { categories } from "@/content/catalog";
import { woodTypes } from "@/content/site";

const categorySlugs = new Set<string>(categories.map((category) => category.slug));
const woodSlugs = new Set<string>(woodTypes.map((wood) => wood.slug));

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80, "Keep your name under 80 characters"),
  phone: z.string().trim().min(7, "Enter a phone number").max(30, "Keep the phone number under 30 characters"),
  city: z.string().trim().max(80, "Keep the city under 80 characters").optional().or(z.literal("")),
  categorySlug: z.string().trim().max(80).optional().or(z.literal("")).refine((value) => !value || categorySlugs.has(value), "Choose a listed category"),
  productId: z.string().trim().optional().or(z.literal("")).refine((value) => !value || z.uuid().safeParse(value).success, "Invalid product"),
  productName: z.string().trim().max(140).optional().or(z.literal("")),
  woodType: z.string().trim().max(40).optional().or(z.literal("")).refine((value) => !value || woodSlugs.has(value), "Choose a listed wood"),
  message: z.string().trim().min(10, "Tell us a little more about what you need").max(1200, "Keep your message under 1200 characters"),
  sourcePath: z.string().trim().min(1).max(200),
  website: z.string().max(0).optional(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
