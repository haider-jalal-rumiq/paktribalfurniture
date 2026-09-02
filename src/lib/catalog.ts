import "server-only";

import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Inquiry, Product } from "@/types/database";

export const getPublishedProducts = cache(
  async (category?: string): Promise<Product[]> => {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];

    let query = supabase
      .from("products")
      .select("*")
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (category) query = query.eq("category_slug", category);

    const { data, error } = await query;
    if (error) {
      console.error("Could not load published products", error.message);
      return [];
    }

    return data;
  },
);

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("Could not load product", error.message);
    return null;
  }

  return data;
});

export async function getStudioProducts(): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Could not load studio products", error.message);
    return [];
  }

  return data;
}

export async function getStudioProduct(id: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Could not load studio product", error.message);
    return null;
  }

  return data;
}

export async function getStudioInquiries(): Promise<Inquiry[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) {
    console.error("Could not load studio enquiries", error.message);
    return [];
  }
  return data;
}
