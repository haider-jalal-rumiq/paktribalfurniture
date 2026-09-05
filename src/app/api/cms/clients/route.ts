import { NextResponse } from "next/server";

import { clientInputSchema } from "@/features/cms/client.schema";
import { orNull } from "@/features/cms/fields";
import { getCmsSession } from "@/lib/cms";

export async function POST(request: Request) {
  const session = await getCmsSession();
  if (!session) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  const parsed = clientInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the client details." },
      { status: 400 },
    );
  }

  const { data, error } = await session.supabase
    .from("clients")
    .insert({
      name: parsed.data.name,
      type: parsed.data.type,
      phone: orNull(parsed.data.phone),
      address: orNull(parsed.data.address),
      notes: orNull(parsed.data.notes),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Could not create client", { code: error.code, message: error.message });
    return NextResponse.json({ message: "The client could not be saved." }, { status: 400 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
