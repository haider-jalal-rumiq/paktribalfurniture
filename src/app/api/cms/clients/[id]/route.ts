import { NextResponse } from "next/server";

import { clientInputSchema } from "@/features/cms/client.schema";
import { orNull } from "@/features/cms/fields";
import { getCmsSession } from "@/lib/cms";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  const { id } = await params;
  const parsed = clientInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the client details." },
      { status: 400 },
    );
  }

  const { error } = await session.supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      phone: orNull(parsed.data.phone),
      address: orNull(parsed.data.address),
      notes: orNull(parsed.data.notes),
    })
    .eq("id", id);

  if (error) {
    console.error("Could not update client", { code: error.code, message: error.message });
    return NextResponse.json({ message: "The client could not be saved." }, { status: 400 });
  }

  return NextResponse.json({ id });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  const { id } = await params;
  const { error } = await session.supabase.from("clients").delete().eq("id", id);

  if (error) {
    console.error("Could not delete client", { code: error.code, message: error.message });
    // orders.client_id is ON DELETE RESTRICT, so this is the common case.
    const message =
      error.code === "23503"
        ? "This client still has orders. Delete or reassign those first."
        : "The client could not be deleted.";
    return NextResponse.json({ message }, { status: 400 });
  }

  return NextResponse.json({ id });
}
