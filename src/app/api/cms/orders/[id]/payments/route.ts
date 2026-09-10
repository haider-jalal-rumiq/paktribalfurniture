import { getCmsSession } from "@/lib/cms";

/** Legacy payment rows are retained in backups. Orders no longer accept payments. */
export async function POST() {
  const session = await getCmsSession();
  if (!session) return Response.json({ message: "Sign in to continue." }, { status: 401 });
  return Response.json({ message: "Order payments have been retired. Record received money with Add balance." }, { status: 410 });
}
