import { NextResponse } from "next/server";

import { parseProductForm, productRecord, uploadProductImages } from "@/lib/product-input";
import { getStudioSession } from "@/lib/studio";

export async function POST(request: Request) {
  const session = await getStudioSession();
  if (!session) return NextResponse.json({ message: "Studio access is required." }, { status: 401 });
  const parsed = parseProductForm(await request.formData());
  if ("error" in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });
  const uploaded = await uploadProductImages(session.supabase, session.userId, parsed.files);
  if ("error" in uploaded) {
    if (uploaded.paths.length) await session.supabase.storage.from("product-images").remove(uploaded.paths);
    return NextResponse.json({ message: uploaded.error }, { status: 500 });
  }
  const imageUrls = [...parsed.input.existingImageUrls, ...uploaded.urls];
  const { data, error } = await session.supabase.from("products").insert(productRecord(parsed.input, imageUrls)).select("id").single();
  if (error) {
    if (uploaded.paths.length) await session.supabase.storage.from("product-images").remove(uploaded.paths);
    console.error("Could not create product", { code: error.code, message: error.message });
    const message = error.code === "23505" ? "That URL slug is already used by another product." : "The product could not be saved.";
    return NextResponse.json({ message }, { status: 400 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
