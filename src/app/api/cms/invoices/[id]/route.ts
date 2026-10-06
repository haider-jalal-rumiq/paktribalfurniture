import { getCmsSession } from "@/lib/cms";
import { saveInvoice } from "@/lib/invoice-write";
type Params = { params: Promise<{ id: string }> };
export async function PUT(request: Request, { params }: Params) { return saveInvoice(request, (await params).id); }
export async function PATCH(request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.status !== "void") return Response.json({ message: "Choose a valid action." }, { status: 400 });
  const { id } = await params;
  const { data, error } = await session.supabase.from("invoices").update({ status: "void" }).eq("id", id).select("id").maybeSingle();
  if (error) {
    console.error("Could not void invoice", { code: error.code, message: error.message });
    return Response.json({ message: "The invoice could not be voided." }, { status: 400 });
  }
  if (!data) return Response.json({ message: "Invoice not found." }, { status: 404 });
  return Response.json({ id });
}

/**
 * A real delete, for an invoice raised by mistake. Voiding is the usual
 * answer — it keeps the record and takes it out of Total sales — so this is
 * the one that removes the numbered invoice from the books entirely.
 * Stock already deducted by the invoice is NOT put back: the pieces left the
 * workshop, and inventory is corrected by hand if they did not.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });
  const { id } = await params;
  const { data, error } = await session.supabase.from("invoices").delete().eq("id", id).select("id").maybeSingle();
  if (error) {
    console.error("Could not delete invoice", { code: error.code, message: error.message });
    return Response.json({ message: "The invoice could not be deleted." }, { status: 400 });
  }
  if (!data) return Response.json({ message: "Invoice not found." }, { status: 404 });
  return Response.json({ id });
}
