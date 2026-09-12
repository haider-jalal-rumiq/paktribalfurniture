import "server-only";

import { woodInputSchema } from "@/features/cms/accounting.schema";
import { orNull } from "@/features/cms/fields";
import { getCmsSession } from "@/lib/cms";

export async function saveWoodEntry(request: Request, id?: string) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });

  const parsed = woodInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Check the wood entry." }, { status: 400 });
  const value = parsed.data;
  if (id && id !== value.id) return Response.json({ message: "Check the wood entry." }, { status: 400 });

  const record = {
    purchaser_name: value.purchaserName,
    period: `${value.period}-01`,
    paid_on: value.paidOn,
    purchased_amount: value.purchasedAmount,
    paid_amount: value.paidAmount,
    notes: orNull(value.notes),
  };
  const { data, error } = id
    ? await session.supabase.from("wood_entries").update(record).eq("id", id).select("id").maybeSingle()
    : await session.supabase.from("wood_entries").upsert({ id: value.id, ...record }, { onConflict: "id", ignoreDuplicates: true }).select("id").maybeSingle();

  if (error) {
    console.error("Could not save wood entry", { code: error.code, message: error.message });
    const message = error.code === "PGRST204" || error.code === "PGRST205"
      ? "The wood ledger database needs the latest update before this entry can be saved."
      : "The wood entry could not be saved.";
    return Response.json({ message }, { status: 400 });
  }
  if (id && !data) return Response.json({ message: "Wood entry not found." }, { status: 404 });
  return Response.json({ id: value.id }, { status: id ? 200 : 201 });
}
