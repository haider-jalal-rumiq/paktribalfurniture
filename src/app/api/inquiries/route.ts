import { NextResponse } from "next/server";

import { getCategory } from "@/content/catalog";
import { site, woodTypes } from "@/content/site";
import { inquirySchema } from "@/features/inquiry/inquiry.schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (isRateLimited(forwarded ?? "unknown")) {
    return NextResponse.json({ message: "Too many enquiries were sent from this connection. Please try again in a few minutes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "The enquiry could not be read. Please check the form and try again." }, { status: 400 });
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Please check the highlighted fields and try again." }, { status: 400 });
  }

  const inquiry = parsed.data;
  if (inquiry.website) return NextResponse.json({ whatsappUrl: site.whatsapp.href });

  const category = inquiry.categorySlug ? getCategory(inquiry.categorySlug) : undefined;
  const wood = inquiry.woodType ? woodTypes.find((item) => item.slug === inquiry.woodType) : undefined;
  const whatsappUrl = buildWhatsAppUrl({
    name: inquiry.name,
    phone: inquiry.phone,
    city: inquiry.city || null,
    category: category?.name ?? null,
    product: inquiry.productName || null,
    wood: wood?.name ?? null,
    message: inquiry.message,
  });

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ message: `The enquiry database is not connected yet. You can still contact us on ${site.whatsapp.display}.`, whatsappUrl }, { status: 503 });
  }

  const { error } = await supabase.from("inquiries").insert({
    name: inquiry.name,
    phone: inquiry.phone,
    city: inquiry.city || null,
    category_slug: inquiry.categorySlug || null,
    product_id: inquiry.productId || null,
    product_name: inquiry.productName || null,
    wood_type: inquiry.woodType || null,
    message: inquiry.message,
    source_path: inquiry.sourcePath,
  });

  if (error) {
    console.error("Could not save furniture enquiry", { code: error.code, message: error.message });
    return NextResponse.json({ message: `We could not save your enquiry. You can still contact us on ${site.whatsapp.display}.`, whatsappUrl }, { status: 500 });
  }

  return NextResponse.json({ whatsappUrl }, { status: 201 });
}
