"use client";

import { useSyncExternalStore } from "react";

import { site } from "@/content/site";
import { zonedNow } from "@/features/hours/hours";

/**
 * The wall clock in the shop's time zone, as an external store.
 *
 * Pages are statically rendered, so anything derived from "now" has to be read
 * on the client or it freezes at build time. `useSyncExternalStore` is the
 * right tool: it gives an explicit server snapshot (`null`) that matches the
 * prerendered HTML, so there is no hydration mismatch and no setState-in-effect.
 */

const TICK_MS = 60_000;

function subscribe(onStoreChange: () => void): () => void {
  const timer = setInterval(onStoreChange, TICK_MS);
  return () => clearInterval(timer);
}

/** Encoded as `day * 1440 + minutes` so the snapshot is a stable primitive. */
function getSnapshot(): number {
  const { day, minutes } = zonedNow(site.timeZone);
  return day * 1440 + minutes;
}

function getServerSnapshot(): null {
  return null;
}

export interface ZonedClock {
  day: number;
  minutes: number;
}

/** `null` until hydrated — render a time-independent fallback in the meantime. */
export function useZonedClock(): ZonedClock | null {
  const encoded = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (encoded === null) return null;
  return { day: Math.floor(encoded / 1440), minutes: encoded % 1440 };
}
