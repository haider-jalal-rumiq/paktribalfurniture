import { buildBackup } from "@/lib/backup";
import { getCmsSession } from "@/lib/cms";
import { today } from "@/lib/cms-core";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });

  const bundle = await buildBackup(session.supabase);
  if ("error" in bundle) return Response.json({ message: bundle.error }, { status: 500 });

  return new Response(JSON.stringify(bundle, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="ptf-backup-${today()}.json"`,
      "cache-control": "no-store",
    },
  });
}
