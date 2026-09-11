import { orNull } from "@/features/cms/fields";
import { inventoryInputSchema } from "@/features/cms/inventory.schema";
import { getCmsSession, getInventoryItem } from "@/lib/cms";
import { MISSING_TABLE, SETUP_MESSAGE, checkImage, removeInventoryImage, uploadInventoryImage } from "@/lib/inventory";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });

  const { id } = await params;
  const existing = await getInventoryItem(id);
  if (!existing) return Response.json({ message: "Item not found." }, { status: 404 });

  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ message: "Check the item and try again." }, { status: 400 });

  const parsed = inventoryInputSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    return Response.json({ message: parsed.error.issues[0]?.message ?? "Check the item." }, { status: 400 });
  }

  const file = form.get("image");
  const image = file instanceof File ? file : null;
  const imageError = checkImage(image);
  if (imageError) return Response.json({ message: imageError }, { status: 400 });

  let imagePath = existing.image_path;
  if (image && image.size > 0) {
    const uploaded = await uploadInventoryImage(session.supabase, session.userId, image);
    if ("error" in uploaded) return Response.json({ message: uploaded.error }, { status: 500 });
    imagePath = uploaded.path;
  } else if (parsed.data.removeImage) {
    imagePath = null;
  }

  const { data, error } = await session.supabase.from("inventory_items").update({
    code: parsed.data.code,
    name: parsed.data.name,
    quantity: parsed.data.quantity,
    note: orNull(parsed.data.note),
    image_path: imagePath,
  }).eq("id", id).select("id").maybeSingle();

  if (error || !data) {
    console.error("Could not update inventory item", { code: error?.code, message: error?.message });
    if (error?.code === MISSING_TABLE) return Response.json({ message: SETUP_MESSAGE }, { status: 503 });
    const duplicate = error?.code === "23505";
    return Response.json({ message: duplicate ? "That code number is already used by another item." : "The item could not be saved." }, { status: 400 });
  }

  // Only drop the old file once the row that referenced it is safely updated.
  if (existing.image_path && existing.image_path !== imagePath) {
    await removeInventoryImage(session.supabase, existing.image_path);
  }
  return Response.json({ id });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });

  const { id } = await params;
  const existing = await getInventoryItem(id);
  const { error } = await session.supabase.from("inventory_items").delete().eq("id", id);
  if (error) {
    console.error("Could not delete inventory item", { code: error.code, message: error.message });
    return Response.json({ message: "The item could not be removed." }, { status: 400 });
  }
  await removeInventoryImage(session.supabase, existing?.image_path ?? null);
  return Response.json({ id });
}
