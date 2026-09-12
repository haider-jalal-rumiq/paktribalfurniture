import { NextResponse } from "next/server";

import { buildBackup } from "@/lib/backup";
import { today } from "@/lib/cms-core";
import { createSupabaseAdminClient, isAuthorisedCron } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** How many weekly snapshots to keep in the private backups bucket. */
const KEEP = 12;

export async function GET(request: Request) {
  if (!isAuthorisedCron(request)) {
    return NextResponse.json({ message: "Not authorised." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    console.error("Backup cron: Supabase service role is not configured.");
    return NextResponse.json({ message: "Not configured." }, { status: 503 });
  }

  const bundle = await buildBackup(supabase);
  if ("error" in bundle) return NextResponse.json({ message: bundle.error }, { status: 500 });

  const name = `ptf-${today()}.json`;
  const { error } = await supabase.storage
    .from("backups")
    .upload(name, JSON.stringify(bundle), { contentType: "application/json", upsert: true });

  if (error) {
    console.error("Backup cron: upload failed", { message: error.message });
    return NextResponse.json({ message: "The backup could not be stored." }, { status: 500 });
  }

  const { data: existing } = await supabase.storage
    .from("backups")
    .list("", { limit: 100, sortBy: { column: "name", order: "desc" } });

  const stale = (existing ?? []).slice(KEEP).map((file) => file.name);
  if (stale.length) await supabase.storage.from("backups").remove(stale);

  return NextResponse.json({
    file: name,
    clients: bundle.clients.length,
    orders: bundle.orders.length,
    payments: bundle.order_payments.length,
    expenses: bundle.expenses.length,
    woodEntries: bundle.wood_entries.length,
    pruned: stale.length,
  });
}
