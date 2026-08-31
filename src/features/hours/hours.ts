import type { OpeningHours } from "@/content/site";

export type OpenState = "open" | "closing-soon" | "closed";

export interface HoursStatus {
  state: OpenState;
  /** Short sentence for the status pill, e.g. "Open now · closes 5:00 PM". */
  label: string;
}

const CLOSING_SOON_MINUTES = 60;

/**
 * Current day-of-week and minutes-past-midnight in a given IANA time zone.
 *
 * Arizona doesn't observe DST, but pinning the zone still matters: the server
 * runs in UTC and visitors are anywhere.
 */
export function zonedNow(
  timeZone: string,
  now: Date = new Date(),
): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // hour12:false can yield "24" at midnight in some runtimes; normalise it.
  const hour = Number(get("hour")) % 24;

  return {
    day: days.indexOf(get("weekday")),
    minutes: hour * 60 + Number(get("minute")),
  };
}

function formatTime(minutes: number): string {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

/** Next day (searching forward, wrapping the week) that has opening hours. */
function nextOpenDay(
  hours: readonly OpeningHours[],
  fromDay: number,
): OpeningHours | undefined {
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (fromDay + offset) % 7;
    const entry = hours.find((item) => item.day === day && item.opens !== null);
    if (entry) return entry;
  }
  return undefined;
}

export function getHoursStatus(
  hours: readonly OpeningHours[],
  day: number,
  minutes: number,
): HoursStatus {
  const today = hours.find((entry) => entry.day === day);

  if (today?.opens != null && today.closes != null) {
    if (minutes < today.opens) {
      return {
        state: "closed",
        label: `Opens today at ${formatTime(today.opens)}`,
      };
    }
    if (minutes < today.closes) {
      const state =
        today.closes - minutes <= CLOSING_SOON_MINUTES ? "closing-soon" : "open";
      return {
        state,
        label:
          state === "closing-soon"
            ? `Closing soon · ${formatTime(today.closes)}`
            : `Open now · closes ${formatTime(today.closes)}`,
      };
    }
  }

  const next = nextOpenDay(hours, day);
  if (!next || next.opens == null) return { state: "closed", label: "Closed" };

  // "tomorrow" reads better than naming the day when it is in fact tomorrow.
  const isTomorrow = next.day === (day + 1) % 7;
  const when = isTomorrow ? "tomorrow" : next.label;
  return { state: "closed", label: `Closed · opens ${when} ${formatTime(next.opens)}` };
}

/** Groups consecutive days sharing identical hours: "Monday – Friday". */
export function summariseHours(hours: readonly OpeningHours[]): string {
  const open = hours.filter((entry) => entry.opens !== null);
  if (open.length === 0) return "Closed";

  const first = open[0];
  const last = open[open.length - 1];
  const uniform = open.every(
    (entry) => entry.opens === first.opens && entry.closes === first.closes,
  );

  if (!uniform || first.opens == null || first.closes == null) {
    return "See hours below";
  }

  const range =
    open.length === 1 ? first.label : `${first.label} – ${last.label}`;
  return `${range}, ${formatTime(first.opens)} – ${formatTime(first.closes)}`;
}
