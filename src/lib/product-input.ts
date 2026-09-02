import type { SupabaseClient } from "@supabase/supabase-js";

import { productInputSchema, type ProductInput } from "@/features/studio/product.schema";
import type { Database } from "@/types/database";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_FILES = 6;

export function parseProductForm(formData: FormData): { input: ProductInput; files: File[] } | { error: string } {
  const files = formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length > MAX_FILES) return { error: `Upload no more than ${MAX_FILES} photos at a time.` };
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return { error: "Use JPEG, PNG, WebP, or AVIF photos." };
    if (file.size > MAX_FILE_SIZE) return { error: "Each photo must be 8 MB or smaller." };
  }
  const parsed = productInputSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    categorySlug: formData.get("categorySlug"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description") ?? "",
    woodTypes: formData.getAll("woodTypes").map(String),
    dimensions: formData.get("dimensions") ?? "",
    priceNote: formData.get("priceNote") ?? "",
    featured: formData.get("featured") === "on",
    published: formData.get("published") === "on",
    existingImageUrls: formData.getAll("existingImageUrls").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the product details and try again." };
  if (parsed.data.existingImageUrls.length + files.length > 12) return { error: "Keep no more than 12 product photos." };
  return { input: parsed.data, files };
}

export async function uploadProductImages(supabase: SupabaseClient<Database>, userId: string, files: File[]): Promise<{ urls: string[]; paths: string[] } | { error: string; paths: string[] }> {
  const urls: string[] = [];
  const paths: string[] = [];
  for (const file of files) {
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "") || "product-image";
    const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      console.error("Could not upload product image", { message: error.message });
      return { error: "A product photo could not be uploaded.", paths };
    }
    paths.push(path);
    urls.push(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
  }
  return { urls, paths };
}

export function storagePathsFromUrls(urls: string[]): string[] {
  const marker = "/storage/v1/object/public/product-images/";
  return urls.flatMap((url) => {
    const index = url.indexOf(marker);
    return index === -1 ? [] : [decodeURIComponent(url.slice(index + marker.length))];
  });
}

export function productRecord(input: ProductInput, imageUrls: string[]) {
  return {
    name: input.name,
    slug: input.slug,
    category_slug: input.categorySlug,
    short_description: input.shortDescription,
    description: input.description,
    wood_types: input.woodTypes,
    dimensions: input.dimensions || null,
    price_note: input.priceNote || null,
    image_urls: imageUrls,
    featured: input.featured,
    published: input.published,
  };
}
