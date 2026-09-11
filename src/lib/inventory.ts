import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InvoiceItem } from "@/types/database";

const BUCKET = "inventory-images";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const SIGNED_URL_TTL = 60 * 60;

/** Codes are compared case- and space-insensitively, matching the SQL unique index. */
export const normaliseCode = (code: string): string => code.trim().toUpperCase();

export function checkImage(file: File | null): string | null {
  if (!file || file.size === 0) return null;
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Use a JPEG, PNG, WebP or AVIF photo.";
  if (file.size > MAX_FILE_SIZE) return "The photo must be 8 MB or smaller.";
  return null;
}

export async function uploadInventoryImage(
  supabase: SupabaseClient<Database>, userId: string, file: File,
): Promise<{ path: string } | { error: string }> {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "") || "item";
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error("Could not upload inventory photo", { message: error.message });
    return { error: "The photo could not be uploaded." };
  }
  return { path };
}

export async function removeInventoryImage(supabase: SupabaseClient<Database>, path: string | null): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error("Could not remove inventory photo", { message: error.message });
}

/** The bucket is private, so pages render time-limited signed URLs. */
export async function signedInventoryUrls(
  supabase: SupabaseClient<Database>, paths: string[],
): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
  if (error || !data) {
    console.error("Could not sign inventory photos", { message: error?.message });
    return {};
  }
  return Object.fromEntries(data.flatMap((entry, index) => (entry.signedUrl ? [[paths[index], entry.signedUrl]] : [])));
}

/**
 * Take invoiced quantities out of stock. Deliberately forgiving: a line whose
 * code matches nothing is ignored, and a line for more than is on hand floors
 * the item at zero and is reported back rather than refused — the sale has
 * already happened, and refusing to bill it would not undo it.
 */
export async function deductInvoicedStock(
  supabase: SupabaseClient<Database>, items: InvoiceItem[],
): Promise<string[]> {
  const wanted = new Map<string, number>();
  for (const item of items) {
    if (!item.code?.trim()) continue;
    const key = normaliseCode(item.code);
    wanted.set(key, (wanted.get(key) ?? 0) + item.quantity);
  }
  if (!wanted.size) return [];

  const { data, error } = await supabase.from("inventory_items").select("id, code, name, quantity");
  if (error || !data) {
    console.error("Could not read inventory to deduct stock", { code: error?.code, message: error?.message });
    return ["Stock could not be updated for this invoice. Check the inventory."];
  }

  const warnings: string[] = [];
  for (const row of data) {
    const take = wanted.get(normaliseCode(row.code));
    if (take === undefined) continue;
    const left = Math.max(0, row.quantity - take);
    if (take > row.quantity) {
      warnings.push(`${row.name} (${row.code}): billed ${take}, only ${row.quantity} in stock. Stock set to 0.`);
    }
    const { error: writeError } = await supabase.from("inventory_items").update({ quantity: left }).eq("id", row.id);
    if (writeError) {
      console.error("Could not deduct stock", { code: writeError.code, message: writeError.message });
      warnings.push(`${row.name} (${row.code}): stock could not be updated.`);
    }
  }
  return warnings;
}
