import { balanceInputSchema } from "@/features/cms/accounting.schema";
import { getCmsSession } from "@/lib/cms";

export async function POST(request: Request) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });
  const parsed = balanceInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  const { id, receivedOn, amount, note } = parsed.data;
  const { error } = await session.supabase.from("balance_entries").upsert({ id, received_on: receivedOn, amount, note }, { onConflict: "id", ignoreDuplicates: true });
  if (error) {
    console.error("Could not add balance", { code: error.code, message: error.message });
    return Response.json({ message: "The balance could not be added." }, { status: 400 });
  }
  return Response.json({ id }, { status: 201 });
}
