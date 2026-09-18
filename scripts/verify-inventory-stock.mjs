import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright";
import { cmsFixture } from "./cms-fixture-server.mjs";

mkdirSync(".verify-cms", { recursive: true });
const fixture = cmsFixture();

// Names that make the suggestion list worth testing, plus a priced item to bill.
const stamp = "2026-09-18T12:00:00Z";
const seed = (code, name, quantity, price) => ({
  id: randomUUID(), item_no: fixture.db.inventory_items.length + 1,
  code, name, quantity, price, image_path: null, note: null, created_at: stamp, updated_at: stamp,
});
fixture.db.inventory_items.push(
  seed("BED-01", "Bed", 10, 45000),
  seed("BED-02", "Bed set", 4, 90000),
  seed("BED-03", "Bed painted", 6, 52000),
  seed("LMP-01", "Lamp", 20, 3500),
  seed("LMP-02", "Lamps", 8, 6000),
);

await new Promise((r) => fixture.server.listen(0, "127.0.0.1", r));
const fixtureUrl = `http://127.0.0.1:${fixture.server.address().port}`;
const BASE = "http://127.0.0.1:3156";
const log = createWriteStream(".verify-cms/inventory-stock.log");
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3156"], {
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
const optionsOf = (page, id) => page.$$eval(`#${id} option`, (els) => els.map((el) => el.getAttribute("value")));

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

  // --- 1. Inventory keeps a price, and suggests names already in stock. ---
  await page.goto(BASE + "/factory/inventory/new", { waitUntil: "networkidle" });
  const suggestions = await optionsOf(page, "inventory-item-names");
  check("the name field suggests the names already in the inventory",
    ["Bed", "Bed set", "Bed painted", "Lamp", "Lamps"].every((name) => suggestions.includes(name)));
  check("the name field is still free text, not a fixed list",
    await page.locator("#name").evaluate((el) => el.tagName.toLowerCase()) === "input");

  await page.locator("#code").fill("TBL-01");
  await page.locator("#name").fill("Coffee table");
  await page.locator("#quantity").fill("7");
  await page.locator("#price").fill("18000");
  await page.getByRole("button", { name: /Save item/ }).click();
  await page.waitForURL(/\/factory\/inventory$/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  const listText = await page.locator(".cms-content").innerText();
  check("the price saves and shows in the inventory list", listText.includes("Coffee table") && listText.includes("Rs 18,000"));

  // --- 2. Billing a stock item fills the line from inventory. ---
  await page.goto(BASE + "/factory/invoices/new", { waitUntil: "networkidle" });
  if (await page.getByText("This section is locked").isVisible().catch(() => false)) {
    await page.getByLabel("Password", { exact: true }).fill("1555");
    await page.getByRole("button", { name: "Unlock", exact: true }).click();
    await page.getByRole("heading", { name: "This section is locked" }).waitFor({ state: "detached" });
  }
  await page.getByRole("button", { name: /Add invoice item/ }).click();

  const itemField = page.locator("[id^=inv-item-]").first();
  await itemField.fill("Bed set");
  const codeField = page.locator("[id^=inv-code-]").first();
  const sourceField = page.locator("[id^=source-]").first();
  const amountField = page.locator("[id^=rate-]").first();
  check("picking a stock item fills its code", await codeField.inputValue() === "BED-02");
  check("picking a stock item sets the source to Stock", await sourceField.inputValue() === "Stock");
  check("picking a stock item fills its price as the amount", await amountField.inputValue() === "90000");
  check("Stock / order is a two-option choice, not free text",
    JSON.stringify((await optionsOf(page, await sourceField.getAttribute("id"))).filter(Boolean)) === JSON.stringify(["Stock", "Order"]));

  // --- 3. Saving the invoice takes that quantity out of stock. ---
  await page.locator("[id^=inv-qty-]").first().fill("3");
  await page.locator("#invoiceClient").selectOption({ label: "QA Pak Turk" });
  await page.getByRole("button", { name: /Save invoice/ }).click();
  await page.waitForURL(/\/factory\/invoices\/[0-9a-f-]+$/, { timeout: 20000 });

  const bedSet = fixture.db.inventory_items.find((row) => row.code === "BED-02");
  check("billing 3 from stock deducts them: 4 in stock becomes 1", bedSet.quantity === 1);
  const untouched = fixture.db.inventory_items.find((row) => row.code === "BED-01");
  check("other inventory items are left alone", untouched.quantity === 10);

  // --- 4. Editing that invoice must not deduct a second time. ---
  await page.getByRole("link", { name: /Edit invoice/ }).click();
  await page.waitForURL(/\/edit$/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Save invoice/ }).click();
  await page.waitForURL(/\/factory\/invoices\/[0-9a-f-]+$/, { timeout: 20000 });
  check("editing the invoice does not double-deduct the same line",
    fixture.db.inventory_items.find((row) => row.code === "BED-02").quantity === 1);

  console.log(`\n${checks.length} inventory/stock checks passed`);
} catch (error) {
  console.error("FAILED", error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  dev.kill();
  fixture.server.close();
}
