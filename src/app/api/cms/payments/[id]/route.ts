import { NextResponse } from "next/server";

import { getCmsSession } from "@/lib/cms";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCmsSession();
  if (!session) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  const { id } = await params;
  const { error } = await session.supabase.from("order_payments").delete().eq("id", id);

  if (error) {
    console.error("Could not delete payment", { code: error.code, message: error.message });
    return NextResponse.json({ message: "The payment could not be removed." }, { status: 400 });
  }

  return NextResponse.json({ id });
}
