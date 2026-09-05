import { NextResponse } from "next/server";

import { getCmsSession } from "@/lib/cms";
import { orderRecord, parseOrderForm, removeOrderImages, uploadOrderImages } from "@/lib/order-images";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  const { id } = await params;
  const parsed = parseOrderForm(await request.formData());
  if ("error" in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

  const { data: current, error: readError } = await session.supabase
    .from("orders")
    .select("image_paths")
    .eq("id", id)
    .maybeSingle();

  if (readError || !current) {
    console.error("Could not read order before update", { code: readError?.code, message: readError?.message });
    return NextResponse.json({ message: "That order could not be found." }, { status: 404 });
  }

  const uploaded = await uploadOrderImages(session.supabase, session.userId, parsed.files);
  if ("error" in uploaded) {
    await removeOrderImages(session.supabase, uploaded.paths);
    return NextResponse.json({ message: uploaded.error }, { status: 500 });
  }

  const kept = parsed.input.existingImagePaths.filter((path) => current.image_paths.includes(path));
  const imagePaths = [...kept, ...uploaded.paths];

  const { error } = await session.supabase
    .from("orders")
    .update(orderRecord(parsed.input, imagePaths))
    .eq("id", id);

  if (error) {
    await removeOrderImages(session.supabase, uploaded.paths);
    console.error("Could not update order", { code: error.code, message: error.message });
    return NextResponse.json({ message: "The order could not be saved." }, { status: 400 });
  }

  // Only once the row is safely updated do the dropped photos go.
  await removeOrderImages(
    session.supabase,
    current.image_paths.filter((path) => !kept.includes(path)),
  );

  return NextResponse.json({ id });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  const { id } = await params;
  const { data: current } = await session.supabase
    .from("orders")
    .select("image_paths")
    .eq("id", id)
    .maybeSingle();

  const { error } = await session.supabase.from("orders").delete().eq("id", id);
  if (error) {
    console.error("Could not delete order", { code: error.code, message: error.message });
    return NextResponse.json({ message: "The order could not be deleted." }, { status: 400 });
  }

  await removeOrderImages(session.supabase, current?.image_paths ?? []);
  return NextResponse.json({ id });
}
