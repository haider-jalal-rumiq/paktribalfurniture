import { NextResponse } from "next/server";

import { orNull } from "@/features/cms/fields";
import { expenseInputSchema } from "@/features/cms/expense.schema";
import { getCmsSession } from "@/lib/cms";

export async function POST(request: Request) {
  const session = await getCmsSession();
  if (!session) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  const parsed = expenseInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the expense details." },
      { status: 400 },
    );
  }

  const { data, error } = await session.supabase
    .from("expenses")
    .insert({
      spent_on: parsed.data.spentOn,
      category: parsed.data.category,
      amount: parsed.data.amount,
      note: orNull(parsed.data.note),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Could not record expense", { code: error.code, message: error.message });
    return NextResponse.json({ message: "The expense could not be saved." }, { status: 400 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
