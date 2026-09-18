import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { cmsFixture } from "./cms-fixture-server.mjs";

mkdirSync(".verify-cms", { recursive: true });
const fixture = cmsFixture();

// The seeded orders have items with no `amount` at all — exactly what the live
// database holds today. Everything below must survive that.
const legacy = fixture.db.orders.flatMap((order) => order.items);
assert.ok(legacy.length > 0 && legacy.every((item) => item.amount === undefined),
  "fixture orders should start with unpriced items");

// A priced stock item, so naming it on an order fills the price.
fixture.db.inventory_items.push({
  id: "8f1f0d1a-0000-4000-8000-000000000001", item_no: 1, code: "TBL-09",
  name: "Office table", quantity: 5, price: 27000, image_path: null, note: null,
  created_at: "2026-09-18T12:00:00Z", updated_at: "2026-09-18T12:00:00Z",
});

await new Promise((r) => fixture.server.listen(0, "127.0.0.1", r));
const fixtureUrl = `http://127.0.0.1:${fixture.server.address().port}`;
const BASE = "http://127.0.0.1:3157";
const log = createWriteStream(".verify-cms/order-prices.log");
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3157"], {
  env: { ...process.env, PTF_CMS_VERIFY: "1", NEXT_PUBLIC_SUPABASE_URL: fixtureUrl, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-fixture-key", NEXT_PUBLIC_SITE_URL: BASE, NEXT_PUBLIC_VAPID_PUBLIC_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
});
dev.stdout.pipe(log);
dev.stderr.pipe(log);

const checks = [];
const check = (name, condition) => {
  assert.ok(condition, name);
  checks.push(name);
  console.log(`PASS ${name}`);
};

let browser;
try {
  for (let i = 0; i < 180; i += 1) {
    try { if ((await fetch(BASE + "/factory/login")).ok) break; } catch { /* not up yet */ }
    if (i === 179) throw new Error("dev server never started");
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1400 } })).newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));

  await page.goto(BASE + "/factory/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email", { exact: true }).fill("qa@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(BASE + "/factory");

  const unlock = async () => {
    if (await page.getByText("This section is locked").isVisible().catch(() => false)) {
      await page.getByLabel("Password", { exact: true }).fill("1555");
      await page.getByRole("button", { name: "Unlock", exact: true }).click();
      await page.getByRole("heading", { name: "This section is locked" }).waitFor({ state: "detached" });
    }
  };

  // --- 1. Unpriced orders still render, and read as Rs 0 rather than break. ---
  await page.goto(BASE + "/factory/orders?view=items", { waitUntil: "networkidle" });
  await unlock();
  const beforeText = await page.locator(".cms-content").innerText();
  check("the by-item view still loads with no prices set", beforeText.includes("item lines"));
  check("unpriced lines show a dash, not Rs 0 noise", beforeText.includes("—"));
  check("the total is shown above the table", beforeText.includes("Worth on completion"));

  // --- 2. Pricing a legacy order's items works and totals up. ---
  await page.goto(BASE + "/factory/orders", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Open \/ edit order/ }).first().click().catch(async () => {
    await page.locator("details").first().click();
  });
  await page.goto(BASE + `/factory/orders/${fixture.order.id}`, { waitUntil: "networkidle" });
  const priceFields = page.locator("input[id^=amount-]");
  check("each order item has a price field", await priceFields.count() === fixture.order.items.length);
  check("a legacy item's price starts at 0, not blank", await priceFields.first().inputValue() === "0");

  // Campus furniture: a dining table at 45,000 and 12 chairs at 8,000 each.
  await priceFields.nth(0).fill("45000");
  await priceFields.nth(1).fill("8000");
  const orderValue = await page.locator("output", { hasText: "Rs" }).first().innerText().catch(() => "");
  check("the form totals the order as it is priced (45,000 x 2 + 8,000 x 12 = 186,000)",
    orderValue.includes("186,000") || (await page.locator(".cms-content").innerText()).includes("Rs 186,000"));

  await page.getByRole("button", { name: /Save order/ }).click();
  const saved = fixture.db.orders.find((row) => row.id === fixture.order.id);
  for (let i = 0; i < 40 && saved.items[0].amount === undefined; i += 1) {
    await new Promise((r) => setTimeout(r, 250));
  }
  check("prices persist on the order's items", saved.items[0].amount === 45000 && saved.items[1].amount === 8000);

  // --- 3. The saved prices drive both views. ---
  await page.goto(BASE + "/factory/orders?view=items", { waitUntil: "networkidle" });
  const itemsText = await page.locator(".cms-content").innerText();
  check("the by-item table shows each line's price", itemsText.includes("Rs 90,000") && itemsText.includes("Rs 96,000"));
  check("a multi-piece line shows its per-piece price too", itemsText.includes("Rs 8,000 each"));
  check("the by-item total is the sum of the priced lines", itemsText.includes("Rs 186,000"));

  await page.goto(BASE + "/factory/orders", { waitUntil: "networkidle" });
  const treeText = await page.locator(".cms-content").innerText();
  check("the by-client view shows the same total", treeText.includes("Rs 186,000"));

  // --- 4. Naming a stock item on an order prices the line from inventory. ---
  await page.goto(BASE + "/factory/orders/new", { waitUntil: "networkidle" });
  await unlock();
  await page.getByRole("button", { name: /Add item/ }).click();
  const names = await page.$$eval("#order-item-names option", (els) => els.map((el) => el.getAttribute("value")));
  check("the order item name suggests inventory items", names.includes("Office table"));
  await page.locator("[id^=item-]").first().fill("Office table");
  check("naming a stock item fills its price from inventory",
    await page.locator("input[id^=amount-]").first().inputValue() === "27000");
  await page.locator("[id^=item-]").first().fill("Custom carved headboard");
  check("a custom item keeps whatever price is there, it is not wiped",
    await page.locator("input[id^=amount-]").first().inputValue() === "27000");

  console.log(`\n${checks.length} order-price checks passed`);
} catch (error) {
  console.error("FAILED", error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  dev.kill();
  fixture.server.close();
}
