import { NextResponse } from "next/server";

import { openOrderStatuses } from "@/content/cms";
import { addDays, today } from "@/lib/cms-core";
import { formatPkr } from "@/lib/money";
import { sendPush } from "@/lib/push";
import { createSupabaseAdminClient, isAuthorisedCron } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** How many days ahead of the expected date the reminder fires. */
const LEAD_DAYS = 2;

export async function GET(request: Request) {
  if (!isAuthorisedCron(request)) {
    return NextResponse.json({ message: "Not authorised." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    console.error("Reminder cron: Supabase service role is not configured.");
    return NextResponse.json({ message: "Not configured." }, { status: 503 });
  }

  const dueOn = addDays(today(), LEAD_DAYS);

  // reminder_sent_at is the dedupe guard: a second run the same day sends nothing.
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_no, title, expected_date, total_amount, clients(name)")
    .eq("expected_date", dueOn)
    .in("status", [...openOrderStatuses])
    .is("reminder_sent_at", null);

  if (error) {
    console.error("Reminder cron: could not read orders", { code: error.code, message: error.message });
    return NextResponse.json({ message: "Query failed." }, { status: 500 });
  }

  if (!orders?.length) {
    return NextResponse.json({ dueOn, orders: 0, sent: 0 });
  }

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (subscriptionError) {
    console.error("Reminder cron: could not read subscriptions", { message: subscriptionError.message });
    return NextResponse.json({ message: "Query failed." }, { status: 500 });
  }

  const rows = orders as unknown as {
    id: string;
    order_no: number;
    title: string;
    total_amount: number;
    clients: { name: string } | null;
  }[];

  const body =
    rows.length === 1
      ? `#${rows[0].order_no} ${rows[0].title} for ${rows[0].clients?.name ?? "a client"} — ${formatPkr(rows[0].total_amount)}`
      : rows.map((row) => `#${row.order_no} ${row.title}`).join(", ");

  const result = await sendPush(supabase, subscriptions ?? [], {
    title: rows.length === 1 ? "1 order due in 2 days" : `${rows.length} orders due in 2 days`,
    body,
    url: "/factory",
    tag: `due-${dueOn}`,
  });

  // Stamp only after a genuine delivery, so a push outage retries tomorrow
  // rather than silently swallowing the reminder.
  if (result.sent > 0) {
    const { error: stampError } = await supabase
      .from("orders")
      .update({ reminder_sent_at: new Date().toISOString() })
      .in(
        "id",
        rows.map((row) => row.id),
      );
    if (stampError) {
      console.error("Reminder cron: could not stamp orders", { message: stampError.message });
    }
  }

  return NextResponse.json({ dueOn, orders: rows.length, ...result });
}
