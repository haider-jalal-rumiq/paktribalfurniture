import { NextResponse } from "next/server";

import { orNull } from "@/features/cms/fields";
import { paymentInputSchema } from "@/features/cms/payment.schema";
import { getCmsSession } from "@/lib/cms";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCmsSession();
  if (!session) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  const { id } = await params;
  const parsed = paymentInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the payment details." },
      { status: 400 },
    );
  }

  const { data, error } = await session.supabase
    .from("order_payments")
    .insert({
      order_id: id,
      amount: parsed.data.amount,
      paid_on: parsed.data.paidOn,
      method: parsed.data.method,
      note: orNull(parsed.data.note),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Could not record payment", { code: error.code, message: error.message });
    return NextResponse.json({ message: "The payment could not be saved." }, { status: 400 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
