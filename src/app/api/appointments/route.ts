import { NextResponse } from "next/server";

import {
  appointmentSchema,
  type AppointmentResponse,
} from "@/features/appointment/appointment.schema";

/**
 * Appointment requests.
 *
 * Pitch build: validates, rate-limits and logs. No email is sent yet — see the
 * TODO below for where Resend drops in.
 */

const WINDOW_MS = 60 * 60 * 1000;
// Households and clinic waiting rooms share an IP; too low a ceiling turns a
// spam control into a way of losing real enquiries. Still ample against bots.
const MAX_PER_WINDOW = 10;

/**
 * ponytail: in-memory rate limit, per server instance. Fine for a single
 * Vercel region on a low-traffic site; move to Upstash/Redis if the shop ever
 * runs multiple instances or the limit needs to actually hold.
 */
const attempts = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter(
    (time) => now - time < WINDOW_MS,
  );

  if (recent.length >= MAX_PER_WINDOW) {
    attempts.set(key, recent);
    return true;
  }

  recent.push(now);
  attempts.set(key, recent);
  return false;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request): Promise<NextResponse<AppointmentResponse>> {
  try {
    if (isRateLimited(clientKey(request))) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You've sent a few requests already. Please call us at (602) 277-5007 and we'll help right away.",
        },
        { status: 429 },
      );
    }

    const body: unknown = await request.json();
    const parsed = appointmentSchema.safeParse(body);

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !errors[field]) {
          errors[field] = issue.message;
        }
      }

      return NextResponse.json(
        { success: false, message: "Please check the highlighted fields.", errors },
        { status: 400 },
      );
    }

    // Honeypot filled means a bot. Answer 200 so it doesn't learn to retry.
    if (parsed.data.website) {
      return NextResponse.json({
        success: true,
        message: "Thanks — we'll be in touch shortly.",
      });
    }

    const { name, email, phone, reason, preferredDay, preferredTime } =
      parsed.data;

    // Structured log, no free-text message body — it can contain health details.
    console.info("appointment.requested", {
      name,
      email,
      phone,
      reason,
      preferredDay,
      preferredTime,
      receivedAt: new Date().toISOString(),
    });

    // TODO(phase 2): send via Resend to sundanceoptical@gmail.com, and mirror to
    // WhatsApp. Notification failure must not fail this request.

    return NextResponse.json({
      success: true,
      message:
        "Thanks — we've got your request. We'll call to confirm within one business day.",
    });
  } catch (error) {
    console.error("appointment.failed", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong on our end. Please call us at (602) 277-5007 and we'll sort it out.",
      },
      { status: 500 },
    );
  }
}
