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
