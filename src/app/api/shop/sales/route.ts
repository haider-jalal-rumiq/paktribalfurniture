import { orNull } from "@/features/cms/fields";
import { shopSaleInputSchema } from "@/features/shop/shop.schema";
import { getCmsSession } from "@/lib/cms";

export async function POST(request: Request) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });

  const parsed = shopSaleInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: parsed.error.issues[0]?.message ?? "Check the sale." }, { status: 400 });
  }

  const { data, error } = await session.supabase.from("shop_sales").insert({
    sold_on: parsed.data.soldOn,
    name: parsed.data.name,
    cost: parsed.data.cost,
    margin_pct: parsed.data.marginPct,
    discount: parsed.data.discount,
    note: orNull(parsed.data.note),
  }).select("id").single();

  if (error) {
    console.error("Could not record shop sale", { code: error.code, message: error.message });
    return Response.json({ message: "The sale could not be saved." }, { status: 400 });
  }
  return Response.json({ id: data.id }, { status: 201 });
}
