import { shopSaleCostSchema } from "@/features/shop/shop.schema";
import { getCmsSession } from "@/lib/cms";
import { today } from "@/lib/cms-core";

type Params = { params: Promise<{ id: string }> };

/**
 * Two edits a sale row accepts: filling in the purchase price on a draft, and
 * marking the item returned to the shop (or undoing that).
 */
export async function PATCH(request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { id } = await params;

  let patch: { cost: number } | { returned_on: string | null };
  if (body && "cost" in body) {
    const parsed = shopSaleCostSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ message: parsed.error.issues[0]?.message ?? "Check the purchase price." }, { status: 400 });
    }
    patch = { cost: parsed.data.cost };
  } else if (typeof body?.returned === "boolean") {
    patch = { returned_on: body.returned ? today() : null };
  } else {
    return Response.json({ message: "Choose a valid action." }, { status: 400 });
  }

  const { data, error } = await session.supabase.from("shop_sales")
    .update(patch).eq("id", id).select("id").maybeSingle();

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
