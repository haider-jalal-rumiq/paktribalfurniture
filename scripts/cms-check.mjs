// Self-check for the CMS money and date logic. Node 24 strips the TS types.
//   node scripts/cms-check.mjs
import assert from "node:assert/strict";

import { formatPkr, formatPkrShort, parseAmount } from "../src/lib/money.ts";
import {
  addDays,
  isDueUrgently,
  daysUntil,
  monthRange,
  orderBalance,
  shiftMonth,
  summariseExpenses,
  today,
} from "../src/lib/cms-core.ts";

// parseAmount — what a person actually types
assert.equal(parseAmount("250000"), 250000);
assert.equal(parseAmount("250,000"), 250000);
assert.equal(parseAmount(" Rs 250,000 "), 250000);
assert.equal(parseAmount("rs.250000"), 250000);
assert.equal(parseAmount("PKR 1,00,000"), 100000);
assert.equal(parseAmount("0"), 0);
assert.equal(parseAmount(12345), 12345);

// ...and what must be rejected rather than silently coerced
assert.equal(parseAmount(""), null, "empty is not zero");
assert.equal(parseAmount("-500"), null, "negative rejected");
assert.equal(parseAmount("250.50"), null, "paisa rejected");
assert.equal(parseAmount("abc"), null);
assert.equal(parseAmount("1e6"), null, "no exponent notation");
assert.equal(parseAmount(null), null);
assert.equal(parseAmount(undefined), null);
assert.equal(parseAmount(2.5), null, "non-integer number rejected");
assert.equal(parseAmount("9".repeat(20)), null, "over the column ceiling");

// Urgent by calendar: two days out or fewer, including overdue.
assert.equal(isDueUrgently(addDays(today(), 3)), false, "three days out is not yet urgent");
assert.equal(isDueUrgently(addDays(today(), 2)), true, "exactly two days out is urgent");
assert.equal(isDueUrgently(addDays(today(), 1)), true, "tomorrow is urgent");
assert.equal(isDueUrgently(today()), true, "due today is urgent");
assert.equal(isDueUrgently(addDays(today(), -5)), true, "overdue stays urgent");
assert.equal(isDueUrgently(null), false, "no delivery date, no calendar urgency");

assert.equal(formatPkr(250000), "Rs 250,000");
assert.equal(formatPkrShort(250000), "Rs 2.5 lac");
assert.equal(formatPkrShort(12000000), "Rs 1.2 cr");
assert.equal(formatPkrShort(4500), "Rs 4,500");

// orderBalance — the number the owner actually chases
assert.deepEqual(orderBalance({ total_amount: 250000, order_payments: [{ amount: 100000 }] }), {
  total: 250000,
  paid: 100000,
  balance: 150000,
});
assert.deepEqual(orderBalance({ total_amount: 250000, order_payments: [] }), {
  total: 250000,
  paid: 0,
  balance: 250000,
});
assert.deepEqual(orderBalance({ total_amount: 300, order_payments: null }).balance, 300);
assert.equal(
  orderBalance({ total_amount: 100, order_payments: [{ amount: 60 }, { amount: 70 }] }).balance,
  -30,
  "overpayment shows as a negative balance, not clamped to zero",
);

// dates
assert.equal(addDays("2026-09-04", 2), "2026-09-06");
assert.equal(addDays("2026-02-27", 2), "2026-03-01", "non-leap February rolls over");
assert.equal(addDays("2024-02-27", 2), "2024-02-29", "leap year keeps the 29th");
assert.equal(addDays("2026-12-31", 1), "2027-01-01");
assert.equal(daysUntil(today()), 0);
assert.equal(daysUntil(addDays(today(), 2)), 2);
assert.equal(daysUntil(addDays(today(), -3)), -3, "overdue is negative");
assert.match(today(), /^\d{4}-\d{2}-\d{2}$/);

assert.deepEqual(monthRange("2026-09"), { start: "2026-09-01", end: "2026-10-01" });
assert.deepEqual(monthRange("2026-12"), { start: "2026-12-01", end: "2027-01-01" });
assert.equal(shiftMonth("2026-01", -1), "2025-12");
assert.equal(shiftMonth("2026-12", 1), "2027-01");

assert.deepEqual(
  summariseExpenses([
    { category: "material", amount: 5000 },
    { category: "labor", amount: 3000 },
    { category: "material", amount: 2000 },
  ]),
  { total: 10000, byCategory: { material: 7000, labor: 3000 } },
);
assert.deepEqual(summariseExpenses([]), { total: 0, byCategory: {} });

// submitRequest must NEVER throw and never leave a caller without a message.
// This is the bug that left "Saving" spinning forever: a bare `await fetch`
// rejects on a dead server and skips straight past setSaving(false).
const { submitRequest } = await import("../src/lib/submit.ts");
const realFetch = globalThis.fetch;

globalThis.fetch = () => Promise.reject(new TypeError("fetch failed"));
const dead = await submitRequest("/api/cms/orders", { method: "POST" });
assert.equal(dead.ok, false, "a dead server must not throw");
assert.match(dead.message, /connection/i, "and must explain itself");

globalThis.fetch = () => Promise.resolve(new Response("<!doctype html>", { status: 500 }));
const broken = await submitRequest("/api/cms/orders", { method: "POST" }, "Could not save.");
assert.equal(broken.ok, false);
assert.equal(broken.message, "Could not save.", "non-JSON error body falls back cleanly");

globalThis.fetch = () => Promise.resolve(new Response("{}", { status: 401 }));
const expired = await submitRequest("/api/cms/orders", { method: "POST" });
assert.match(expired.message, /session/i, "401 tells you to sign in again");

globalThis.fetch = () =>
  Promise.resolve(new Response(JSON.stringify({ id: "abc" }), { status: 201 }));
const good = await submitRequest("/api/cms/orders", { method: "POST" });
assert.deepEqual(good, { ok: true, id: "abc", message: "" });

globalThis.fetch = (_url, init) =>
  new Promise((_resolve, reject) =>
    init.signal.addEventListener("abort", () =>
      reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
    ),
  );
const aborted = submitRequest("/api/cms/orders", { method: "POST" });
// Trip the timeout immediately rather than waiting 90s for it.
const pending = await Promise.race([aborted, Promise.resolve("still-pending")]);
assert.equal(pending, "still-pending", "a hung request stays pending, it does not resolve early");

globalThis.fetch = realFetch;

console.log("cms-check: all assertions passed");
