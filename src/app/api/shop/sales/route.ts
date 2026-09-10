import { orNull } from "@/features/cms/fields";
import { shopSaleInputSchema } from "@/features/shop/shop.schema";
import { manualSalePrice } from "@/lib/accounting-core";
import { getCmsSession } from "@/lib/cms";

export async function POST(request: Request) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });

  const parsed = shopSaleInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: parsed.error.issues[0]?.message ?? "Check the sale." }, { status: 400 });
  }

  const input = parsed.data;
  const { data, error } = await session.supabase.from("shop_sales").insert({
    sold_on: input.soldOn,
    name: input.name,
    quantity: input.quantity,
    sale_price: Number(manualSalePrice(input.cost, input.marginPct, input.discountPct).salePrice),
    cost: input.cost,
    margin_pct: input.marginPct,
    discount_pct: input.discountPct,
    note: orNull(input.note),
  }).select("id").single();

  if (error) {
    console.error("Could not record shop sale", { code: error.code, message: error.message });
    return Response.json({ message: "The sale could not be saved." }, { status: 400 });
  }
  return Response.json({ id: data.id }, { status: 201 });
}
