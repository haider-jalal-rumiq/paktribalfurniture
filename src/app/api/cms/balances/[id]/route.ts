import { getCmsSession } from "@/lib/cms";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });
  const { id } = await params;
  const { error } = await session.supabase.from("balance_entries").delete().eq("id", id);
  if (error) {
    console.error("Could not remove balance", { code: error.code, message: error.message });
    return Response.json({ message: "The balance could not be removed." }, { status: 400 });
  }
  return Response.json({ id });
}
