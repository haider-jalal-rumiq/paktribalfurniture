import { z } from "zod";

import { categories } from "@/content/catalog";
import { woodTypes } from "@/content/site";

const categorySlugs = new Set<string>(categories.map((category) => category.slug));
const woodSlugs = new Set<string>(woodTypes.map((wood) => wood.slug));

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name").max(140),
  slug: z.string().trim().min(2, "Enter a URL slug").max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens"),
  categorySlug: z.string().refine((value) => categorySlugs.has(value), "Choose a category"),
  shortDescription: z.string().trim().min(10, "Add a short description").max(220),
  description: z.string().trim().max(4000),
  woodTypes: z.array(z.string()).max(5).refine((values) => values.every((value) => woodSlugs.has(value)), "Choose listed wood types"),
  dimensions: z.string().trim().max(160),
  priceNote: z.string().trim().max(120),
  featured: z.boolean(),
  published: z.boolean(),
  existingImageUrls: z.array(z.url()).max(12),
});

export type ProductInput = z.infer<typeof productInputSchema>;
