import { orNull } from "@/features/cms/fields";
import { shopInvoiceInputSchema } from "@/features/shop/shop.schema";
import { getCmsSession } from "@/lib/cms";

export async function POST(request: Request) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });

  const parsed = shopInvoiceInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: parsed.error.issues[0]?.message ?? "Check the invoice." }, { status: 400 });
  }
  const input = parsed.data;

  // Keyed on the client-generated id, so a retry after a dropped reply cannot
  // bill the same counter sale twice.
  const { data, error } = await session.supabase.from("shop_invoices").upsert({
    id: input.id,
    customer_name: input.customerName,
    customer_phone: orNull(input.customerPhone),
    customer_address: orNull(input.customerAddress),
    issued_on: input.issuedOn,
    items: input.items,
    notes: orNull(input.notes),
  }, { onConflict: "id", ignoreDuplicates: true }).select("id").maybeSingle();

  if (error) {
    console.error("Could not save shop invoice", { code: error.code, message: error.message });
    return Response.json({ message: "The invoice could not be saved." }, { status: 400 });
  }
  return Response.json({ id: data?.id ?? input.id }, { status: 201 });
}
