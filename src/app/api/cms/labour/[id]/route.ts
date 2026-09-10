import { saveLabour } from "@/lib/labour-write";
import { getCmsSession } from "@/lib/cms";
type Params = { params: Promise<{ id: string }> };
export async function PUT(request: Request, { params }: Params) { return saveLabour(request, (await params).id); }
export async function DELETE(_request: Request, { params }: Params) {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });
  const { id } = await params;
  const { error } = await session.supabase.from("labour_entries").delete().eq("id", id);
  if (error) {
    console.error("Could not delete labour entry", { code: error.code, message: error.message });
    return Response.json({ message: "The entry could not be removed." }, { status: 400 });
  }
  return Response.json({ id });
}
