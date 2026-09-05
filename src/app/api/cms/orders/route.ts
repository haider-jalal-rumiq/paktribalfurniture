import { NextResponse } from "next/server";

import { getCmsSession } from "@/lib/cms";
import { orderRecord, parseOrderForm, removeOrderImages, uploadOrderImages } from "@/lib/order-images";

export async function POST(request: Request) {
  const session = await getCmsSession();
  if (!session) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  const parsed = parseOrderForm(await request.formData());
  if ("error" in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

  const uploaded = await uploadOrderImages(session.supabase, session.userId, parsed.files);
  if ("error" in uploaded) {
    await removeOrderImages(session.supabase, uploaded.paths);
    return NextResponse.json({ message: uploaded.error }, { status: 500 });
  }

  const imagePaths = [...parsed.input.existingImagePaths, ...uploaded.paths];
  const { data, error } = await session.supabase
    .from("orders")
    .insert(orderRecord(parsed.input, imagePaths))
    .select("id")
    .single();

  if (error) {
    await removeOrderImages(session.supabase, uploaded.paths);
    console.error("Could not create order", { code: error.code, message: error.message });
    return NextResponse.json({ message: "The order could not be saved." }, { status: 400 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
