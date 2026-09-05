import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";

import type { Database, PushSubscriptionRow } from "@/types/database";

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

let configured = false;

function configure(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contact = process.env.VAPID_SUBJECT ?? "mailto:paktribalfurniture@gmail.com";
  if (!publicKey || !privateKey) return false;

  if (!configured) {
    webpush.setVapidDetails(contact, publicKey, privateKey);
    configured = true;
  }
  return true;
}

/**
 * Sends to every stored subscription and deletes the ones the push service
 * reports as gone (404/410) — otherwise dead devices accumulate forever.
 */
export async function sendPush(
  supabase: SupabaseClient<Database>,
  subscriptions: PushSubscriptionRow[],
  message: PushMessage,
): Promise<{ sent: number; failed: number; pruned: number }> {
  if (!configure()) {
    console.error("Push is not configured: VAPID keys are missing.");
    return { sent: 0, failed: subscriptions.length, pruned: 0 };
  }

  const payload = JSON.stringify(message);
  const dead: string[] = [];
  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        payload,
      );
      sent += 1;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        dead.push(subscription.id);
      } else {
        failed += 1;
        console.error("Push delivery failed", { status });
      }
    }
  }

  if (dead.length) {
    await supabase.from("push_subscriptions").delete().in("id", dead);
  }

  return { sent, failed, pruned: dead.length };
}
