/**
 * Self-check for the open/closed logic. Run: `npm run check:hours`
 *
 * Day boundaries and the closed-weekend wrap are the parts that break silently,
 * so they get pinned here.
 */
import assert from "node:assert/strict";

import { getHoursStatus, summariseHours, zonedNow } from "./hours.ts";

const H = 60;
const hours = [
  { day: 1, label: "Monday", opens: 8 * H, closes: 17 * H },
  { day: 2, label: "Tuesday", opens: 8 * H, closes: 17 * H },
  { day: 3, label: "Wednesday", opens: 8 * H, closes: 17 * H },
  { day: 4, label: "Thursday", opens: 8 * H, closes: 17 * H },
  { day: 5, label: "Friday", opens: 8 * H, closes: 17 * H },
  { day: 6, label: "Saturday", opens: null, closes: null },
  { day: 0, label: "Sunday", opens: null, closes: null },
];

// Mid-morning Tuesday.
assert.equal(getHoursStatus(hours, 2, 10 * H).state, "open");
assert.match(getHoursStatus(hours, 2, 10 * H).label, /closes 5:00 PM/);

// Within the last hour.
assert.equal(getHoursStatus(hours, 2, 16 * H + 30).state, "closing-soon");

// Boundaries: open at exactly 8:00, closed at exactly 17:00.
assert.equal(getHoursStatus(hours, 2, 8 * H).state, "open");
assert.equal(getHoursStatus(hours, 2, 17 * H).state, "closed");

// Before opening, same day.
assert.match(getHoursStatus(hours, 2, 7 * H).label, /Opens today at 8:00 AM/);

// After closing on a weekday points at tomorrow.
assert.match(getHoursStatus(hours, 2, 18 * H).label, /opens tomorrow 8:00 AM/);

// Friday evening must skip the closed weekend and name Monday.
assert.match(getHoursStatus(hours, 5, 18 * H).label, /opens Monday 8:00 AM/);

// Saturday is closed all day; Sunday should say "tomorrow" (Monday).
assert.match(getHoursStatus(hours, 6, 12 * H).label, /opens Monday 8:00 AM/);
assert.match(getHoursStatus(hours, 0, 12 * H).label, /opens tomorrow 8:00 AM/);

assert.equal(summariseHours(hours), "Monday – Friday, 8:00 AM – 5:00 PM");

// Zoned clock must return a real weekday index and a sane minute count.
const now = zonedNow("America/Phoenix");
assert.ok(now.day >= 0 && now.day <= 6, "weekday out of range");
assert.ok(now.minutes >= 0 && now.minutes < 1440, "minutes out of range");

// Midnight in Phoenix must be 0 minutes, not 1440.
assert.equal(
  zonedNow("America/Phoenix", new Date("2026-08-31T07:00:00Z")).minutes,
  0,
);

console.log("hours: all checks passed");
