import "server-only";
import { invoiceInputSchema } from "@/features/cms/accounting.schema";
import { orNull } from "@/features/cms/fields";
import { getCmsSession } from "@/lib/cms";

export async function saveInvoice(request: Request, id?: string) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });
  const parsed = invoiceInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  const input = parsed.data;
  if (id && input.id !== id) return Response.json({ message: "Check the invoice and try again." }, { status: 400 });
  const { data: client, error: clientError } = await session.supabase.from("clients").select("id, name, phone, address").eq("id", input.clientId).maybeSingle();
  if (clientError) console.error("Could not load invoice client", { code: clientError.code, message: clientError.message });
  if (clientError || !client) return Response.json({ message: "That client could not be found." }, { status: 400 });
  const { data: previous, error: readError } = id ? await session.supabase.from("invoices").select("*").eq("id", id).maybeSingle() : { data: null, error: null };
  if (readError) {
    console.error("Could not load invoice before update", { code: readError.code, message: readError.message });
    return Response.json({ message: "The invoice could not be loaded. Please try again." }, { status: 500 });
  }
  if (id && (!previous || previous.status === "void")) return Response.json({ message: "This invoice is missing or has been voided." }, { status: 409 });
  const keepSnapshot = previous?.client_id === client.id;
  const record = {
    client_id: client.id,
    client_name: keepSnapshot ? previous.client_name : client.name,
    client_phone: keepSnapshot ? previous.client_phone : client.phone,
    client_address: keepSnapshot ? previous.client_address : client.address,
    issued_on: input.issuedOn, items: input.items, notes: orNull(input.notes),
  };
  const { data, error } = id
    ? await session.supabase.from("invoices").update(record).eq("id", id).eq("status", "issued").select("id").maybeSingle()
    : await session.supabase.from("invoices").upsert({ id: input.id, ...record }, { onConflict: "id", ignoreDuplicates: true }).select("id").maybeSingle();
  if (error) {
    console.error("Could not save invoice", { code: error.code, message: error.message });
    return Response.json({ message: "The invoice could not be saved." }, { status: 400 });
  }
  if (id && !data) return Response.json({ message: "This invoice has changed. Refresh before editing." }, { status: 409 });
  return Response.json({ id: input.id }, { status: id ? 200 : 201 });
}
