import type { SupabaseClient } from "@supabase/supabase-js";

import { orderInputSchema, type OrderInput } from "@/features/cms/order.schema";
import { orNull } from "@/features/cms/fields";
import type { Database } from "@/types/database";

const BUCKET = "order-images";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_FILES = 6;
const MAX_TOTAL = 12;
const SIGNED_URL_TTL = 60 * 60; // one hour is plenty for a page view

export function parseOrderForm(formData: FormData): { input: OrderInput; files: File[] } | { error: string } {
  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length > MAX_FILES) return { error: `Upload no more than ${MAX_FILES} photos at a time.` };
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return { error: "Use JPEG, PNG, WebP, or AVIF photos." };
    if (file.size > MAX_FILE_SIZE) return { error: "Each photo must be 8 MB or smaller." };
  }

  const parsed = orderInputSchema.safeParse({
    clientId: formData.get("clientId") ?? "",
    siteLabel: formData.get("siteLabel") ?? "",
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    deliveryAddress: formData.get("deliveryAddress") ?? "",
    contactPhone: formData.get("contactPhone") ?? "",
    totalAmount: formData.get("totalAmount") ?? "",
    orderDate: formData.get("orderDate") ?? "",
    expectedDate: formData.get("expectedDate") ?? "",
    status: formData.get("status") ?? "",
    notes: formData.get("notes") ?? "",
    existingImagePaths: formData.getAll("existingImagePaths").map(String),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the order details and try again." };
  }
  if (parsed.data.existingImagePaths.length + files.length > MAX_TOTAL) {
    return { error: `Keep no more than ${MAX_TOTAL} photos on an order.` };
  }

  return { input: parsed.data, files };
}

export async function uploadOrderImages(
  supabase: SupabaseClient<Database>,
  userId: string,
  files: File[],
): Promise<{ paths: string[] } | { error: string; paths: string[] }> {
  const paths: string[] = [];

  for (const file of files) {
    const safeName =
      file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "") || "order-photo";
    const path = `${userId}/${crypto.randomUUID()}-${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      console.error("Could not upload order photo", { message: error.message });
      return { error: "An order photo could not be uploaded.", paths };
    }
    paths.push(path);
  }

  return { paths };
}

export async function removeOrderImages(
  supabase: SupabaseClient<Database>,
  paths: string[],
): Promise<void> {
  if (!paths.length) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.error("Could not remove order photos", { message: error.message });
}

/**
 * The bucket is private, so pages render time-limited signed URLs rather than
 * a permanent public link to a customer's order photos.
 */
export async function signedOrderImageUrls(
  supabase: SupabaseClient<Database>,
  paths: string[],
): Promise<{ path: string; url: string }[]> {
  if (!paths.length) return [];

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
  if (error || !data) {
    console.error("Could not sign order photos", { message: error?.message });
    return [];
  }

  return data.flatMap((entry, index) =>
    entry.signedUrl ? [{ path: paths[index], url: entry.signedUrl }] : [],
  );
}

export function orderRecord(input: OrderInput, imagePaths: string[]) {
  return {
    client_id: input.clientId,
    site_label: orNull(input.siteLabel),
    title: input.title,
    description: input.description,
    delivery_address: orNull(input.deliveryAddress),
    contact_phone: orNull(input.contactPhone),
    total_amount: input.totalAmount,
    order_date: input.orderDate,
    expected_date: orNull(input.expectedDate),
    status: input.status,
    image_paths: imagePaths,
    notes: orNull(input.notes),
  };
}
