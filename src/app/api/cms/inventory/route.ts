import { orNull } from "@/features/cms/fields";
import { inventoryInputSchema } from "@/features/cms/inventory.schema";
import { getCmsSession } from "@/lib/cms";
import { checkImage, removeInventoryImage, uploadInventoryImage } from "@/lib/inventory";

export async function POST(request: Request) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });

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

  let imagePath: string | null = null;
  if (image && image.size > 0) {
    const uploaded = await uploadInventoryImage(session.supabase, session.userId, image);
    if ("error" in uploaded) return Response.json({ message: uploaded.error }, { status: 500 });
    imagePath = uploaded.path;
  }

  const { data, error } = await session.supabase.from("inventory_items").insert({
    code: parsed.data.code,
    name: parsed.data.name,
    quantity: parsed.data.quantity,
    note: orNull(parsed.data.note),
    image_path: imagePath,
  }).select("id").single();

  if (error) {
    await removeInventoryImage(session.supabase, imagePath);
    console.error("Could not add inventory item", { code: error.code, message: error.message });
    const duplicate = error.code === "23505";
    return Response.json({ message: duplicate ? "That code number is already used by another item." : "The item could not be saved." }, { status: 400 });
  }
  return Response.json({ id: data.id }, { status: 201 });
}
