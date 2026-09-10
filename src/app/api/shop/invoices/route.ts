import { orNull } from "@/features/cms/fields";
import { shopInvoiceInputSchema } from "@/features/shop/shop.schema";
import { shopInvoiceNumber } from "@/lib/accounting-core";
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
  // bill the same counter sale twice. `ignoreDuplicates` means a retry returns
  // no row — which is also how we know not to draft the sale rows again.
  const { data, error } = await session.supabase.from("shop_invoices").upsert({
    id: input.id,
    customer_name: input.customerName,
    customer_phone: orNull(input.customerPhone),
    customer_address: orNull(input.customerAddress),
    issued_on: input.issuedOn,
    items: input.items,
    discount_pct: input.discountPct,
    notes: orNull(input.notes),
  }, { onConflict: "id", ignoreDuplicates: true }).select("id, invoice_no").maybeSingle();

  if (error) {
    console.error("Could not save shop invoice", { code: error.code, message: error.message });
    return Response.json({ message: "The invoice could not be saved." }, { status: 400 });
  }
  if (!data) return Response.json({ id: input.id }, { status: 201 });

  // Every billed line becomes a draft row in the ledger, waiting only for its
  // purchase price. The discount is spread across the lines at the same
  // percentage, so a line's price can round up to a rupee away from an exact
  // share of the invoice total — the invoice itself remains the billed figure.
  const reference = shopInvoiceNumber(data.invoice_no);
  const drafts = input.items.map((item) => {
    const unit = BigInt(item.amount);
    const share = (unit * BigInt(input.discountPct) + 50n) / 100n;
    return {
      sold_on: input.issuedOn,
      name: item.item,
      quantity: item.quantity,
      sale_price: Number(unit - share),
      invoice_id: data.id,
      note: reference,
    };
  });

  const { error: draftError } = await session.supabase.from("shop_sales").insert(drafts);
  if (draftError) {
    // The invoice is saved and correct; only the ledger drafts are missing, so
    // say so rather than implying the sale was not billed.
    console.error("Could not draft shop sales from invoice", { code: draftError.code, message: draftError.message });
    return Response.json({
      id: data.id,
      message: `${reference} was saved, but its rows could not be added to Sales. Add them by hand.`,
    }, { status: 201 });
  }

  return Response.json({ id: data.id }, { status: 201 });
}
