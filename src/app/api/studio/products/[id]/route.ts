import { NextResponse } from "next/server";

import { parseProductForm, productRecord, storagePathsFromUrls, uploadProductImages } from "@/lib/product-input";
import { getStudioSession } from "@/lib/studio";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getStudioSession();
  if (!session) return NextResponse.json({ message: "Studio access is required." }, { status: 401 });
  const { id } = await params;
  const { data: current, error: currentError } = await session.supabase.from("products").select("image_urls").eq("id", id).maybeSingle();
  if (currentError || !current) return NextResponse.json({ message: "The product was not found." }, { status: 404 });
  const parsed = parseProductForm(await request.formData());
  if ("error" in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });
  const uploaded = await uploadProductImages(session.supabase, session.userId, parsed.files);
  if ("error" in uploaded) {
    if (uploaded.paths.length) await session.supabase.storage.from("product-images").remove(uploaded.paths);
    return NextResponse.json({ message: uploaded.error }, { status: 500 });
  }
  const imageUrls = [...parsed.input.existingImageUrls, ...uploaded.urls];
  const { error } = await session.supabase.from("products").update(productRecord(parsed.input, imageUrls)).eq("id", id);
  if (error) {
    if (uploaded.paths.length) await session.supabase.storage.from("product-images").remove(uploaded.paths);
    console.error("Could not update product", { code: error.code, message: error.message });
    const message = error.code === "23505" ? "That URL slug is already used by another product." : "The product could not be saved.";
    return NextResponse.json({ message }, { status: 400 });
  }
  const removed = current.image_urls.filter((url) => !parsed.input.existingImageUrls.includes(url));
  const removedPaths = storagePathsFromUrls(removed);
  if (removedPaths.length) await session.supabase.storage.from("product-images").remove(removedPaths);
  return NextResponse.json({ id });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getStudioSession();
  if (!session) return NextResponse.json({ message: "Studio access is required." }, { status: 401 });
  const { id } = await params;
  const { data: product } = await session.supabase.from("products").select("image_urls").eq("id", id).maybeSingle();
  const { error } = await session.supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("Could not delete product", { code: error.code, message: error.message });
    return NextResponse.json({ message: "The product could not be deleted." }, { status: 400 });
  }
  const paths = storagePathsFromUrls(product?.image_urls ?? []);
  if (paths.length) await session.supabase.storage.from("product-images").remove(paths);
  return NextResponse.json({ deleted: true });
}
