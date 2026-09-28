import { NextResponse } from "next/server";
import { z } from "zod";

import { orderStatusValues } from "@/content/cms";
import { oneOf } from "@/features/cms/fields";
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

/**
 * One field at a time, from the orders list: an item's status, or the order's
 * urgent flag. The full PUT above rewrites the whole order from the form, which
 * is far too much to send just to tick a piece off.
 */
const patchSchema = z.union([
  z.object({ itemId: z.uuid(), status: oneOf(orderStatusValues, "Choose an item status") }),
  z.object({ urgent: z.boolean() }),
]);

export async function PATCH(request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Choose a valid change." }, { status: 400 });

  if ("urgent" in parsed.data) {
    const { data, error } = await session.supabase.from("orders")
      .update({ urgent: parsed.data.urgent }).eq("id", id).select("id").maybeSingle();
    if (error) {
      console.error("Could not update order urgency", { code: error.code, message: error.message });
      return NextResponse.json({ message: "The order could not be updated." }, { status: 400 });
    }
    if (!data) return NextResponse.json({ message: "Order not found." }, { status: 404 });
    return NextResponse.json({ id });
  }

  // Item status lives inside the order's items array, so it is read, changed
  // and written back whole.
  const { data: current, error: readError } = await session.supabase
    .from("orders").select("items").eq("id", id).maybeSingle();
  if (readError) {
    console.error("Could not load order before status change", { code: readError.code, message: readError.message });
    return NextResponse.json({ message: "The order could not be loaded." }, { status: 500 });
  }
  if (!current) return NextResponse.json({ message: "Order not found." }, { status: 404 });

  const { itemId, status } = parsed.data;
  if (!current.items.some((item) => item.id === itemId)) {
    return NextResponse.json({ message: "That item is not on this order." }, { status: 404 });
  }
  const items = current.items.map((item) => (item.id === itemId ? { ...item, status } : item));

  const { error } = await session.supabase.from("orders").update({ items }).eq("id", id).select("id").maybeSingle();
  if (error) {
    console.error("Could not update item status", { code: error.code, message: error.message });
    return NextResponse.json({ message: "The item status could not be updated." }, { status: 400 });
  }
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
