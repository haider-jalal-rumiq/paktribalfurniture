import { NextResponse } from "next/server";
import { z } from "zod";

import { getCmsSession } from "@/lib/cms";

const subscriptionSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(400), auth: z.string().min(1).max(400) }),
  label: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  const session = await getCmsSession();
  if (!session) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "That subscription is not valid." }, { status: 400 });
  }

  // One row per endpoint: re-subscribing the same device updates rather than duplicates.
  const { error } = await session.supabase.from("push_subscriptions").upsert(
    {
      user_id: session.userId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      label: parsed.data.label ?? null,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    console.error("Could not save push subscription", { code: error.code, message: error.message });
    return NextResponse.json({ message: "Notifications could not be enabled." }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getCmsSession();
  if (!session) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  const parsed = z
    .object({ endpoint: z.url().max(1000) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Missing endpoint." }, { status: 400 });

  const { error } = await session.supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", parsed.data.endpoint);

  if (error) {
    console.error("Could not remove push subscription", { code: error.code, message: error.message });
    return NextResponse.json({ message: "Notifications could not be turned off." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
