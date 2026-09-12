import { getCmsSession } from "@/lib/cms";
import { saveWoodEntry } from "@/lib/wood-write";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  return saveWoodEntry(request, (await params).id);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });
  const { id } = await params;
  const { error } = await session.supabase.from("wood_entries").delete().eq("id", id);
  if (error) {
    console.error("Could not delete wood entry", { code: error.code, message: error.message });
    return Response.json({ message: "The wood entry could not be removed." }, { status: 400 });
  }
  return Response.json({ id });
}
