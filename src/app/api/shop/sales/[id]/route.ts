import { getCmsSession } from "@/lib/cms";
import { today } from "@/lib/cms-core";

type Params = { params: Promise<{ id: string }> };

/** Mark an item returned to the shop, or undo it. A return leaves the totals. */
export async function PATCH(request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.returned !== "boolean") {
    return Response.json({ message: "Choose a valid action." }, { status: 400 });
  }

  const { id } = await params;
  const { data, error } = await session.supabase.from("shop_sales")
    .update({ returned_on: body.returned ? today() : null }).eq("id", id).select("id").maybeSingle();

  if (error) {
    console.error("Could not update shop sale", { code: error.code, message: error.message });
    return Response.json({ message: "The sale could not be updated." }, { status: 400 });
  }
  if (!data) return Response.json({ message: "Sale not found." }, { status: 404 });
  return Response.json({ id });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });

  const { id } = await params;
  const { error } = await session.supabase.from("shop_sales").delete().eq("id", id);
  if (error) {
    console.error("Could not delete shop sale", { code: error.code, message: error.message });
    return Response.json({ message: "The sale could not be removed." }, { status: 400 });
  }
  return Response.json({ id });
}
