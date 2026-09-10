import { orNull } from "@/features/cms/fields";
import { expenseInputSchema } from "@/features/cms/expense.schema";
import { getCmsSession } from "@/lib/cms";

// Same fields as a factory expense, so the same schema — only the table differs.
export async function POST(request: Request) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });

  const parsed = expenseInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: parsed.error.issues[0]?.message ?? "Check the expense details." }, { status: 400 });
  }

  const { data, error } = await session.supabase.from("shop_expenses").insert({
    spent_on: parsed.data.spentOn,
    category: parsed.data.category,
    amount: parsed.data.amount,
    note: orNull(parsed.data.note),
  }).select("id").single();

  if (error) {
    console.error("Could not record shop expense", { code: error.code, message: error.message });
    return Response.json({ message: "The expense could not be saved." }, { status: 400 });
  }
  return Response.json({ id: data.id }, { status: 201 });
}
