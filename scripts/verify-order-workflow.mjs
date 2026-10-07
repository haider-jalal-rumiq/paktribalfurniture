import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { cmsFixture } from "./cms-fixture-server.mjs";

mkdirSync(".verify-cms", { recursive: true });
const fixture = cmsFixture();
await new Promise((r) => fixture.server.listen(0, "127.0.0.1", r));
const fixtureUrl = `http://127.0.0.1:${fixture.server.address().port}`;
const BASE = "http://127.0.0.1:3159";
const log = createWriteStream(".verify-cms/order-workflow.log");
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3159"], {
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
    try { if ((await fetch(BASE + "/factory/login")).ok) break; } catch { /* not up */ }
    if (i === 179) throw new Error("dev server never started");
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1200 } })).newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));

  await page.goto(BASE + "/factory/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email", { exact: true }).fill("qa@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(BASE + "/factory");

  await page.goto(BASE + "/factory/orders?view=items", { waitUntil: "networkidle" });
  if (await page.getByText("This section is locked").isVisible().catch(() => false)) {
    await page.getByLabel("Password", { exact: true }).fill("1777");
    await page.getByRole("button", { name: "Unlock", exact: true }).click();
    await page.getByRole("heading", { name: "This section is locked" }).waitFor({ state: "detached" });
  }

  // --- 1. An item's status changes from the list, without opening the order. ---
  // Row picked by its item name: the table's order is not the fixture's.
  const target = fixture.order;                    // "Campus furniture"
  const [dining, chairs] = target.items;           // Dining table, Chairs
  const row = page.locator("tr", { hasText: dining.name });
  const statusOf = () => row.getByLabel("Item status");

  check("the item status is a dropdown, not a read-only badge",
    await statusOf().evaluate((el) => el.tagName.toLowerCase()) === "select");
  check("it starts on the item's real status", await statusOf().inputValue() === dining.status);

  const live = () => fixture.db.orders.find((order) => order.id === target.id);
  const settled = async (done) => {
    for (let i = 0; i < 40 && !done(); i += 1) await new Promise((r) => setTimeout(r, 250));
  };

  await statusOf().selectOption("completed");
  await settled(() => live().items[0].status === "completed");
  check("choosing a status saves it to that item", live().items[0].status === "completed");
  check("the order's other items are untouched", live().items[1].status === chairs.status);

  await page.reload({ waitUntil: "networkidle" });
  check("the change survives a reload", await statusOf().inputValue() === "completed");

  // --- 2. Urgency is the order's flag, toggled from the same row. ---
  const urgentBefore = live().urgent;
  await row.getByRole("button", { name: /urgent/i }).click();
  await settled(() => live().urgent !== urgentBefore);
  check("the urgent toggle flips the order's own flag", live().urgent !== urgentBefore);

  // --- 3. Saving an order still lands on fresh data after dropping refresh(). ---
  // The list keeps orders inside collapsed client cards, so the always-visible
  // "N orders" summary is what gets compared.
  const orderCount = async () => {
    const text = await page.locator(".cms-content").innerText();
    return Number(text.match(/(\d+)\s*orders/)?.[1] ?? -1);
  };
  await page.goto(BASE + "/factory/orders", { waitUntil: "networkidle" });
  await page.getByText(/pieces\. Expand a client/).waitFor({ timeout: 20000 });
  const before = await orderCount();
  check("the orders list reports a count to compare against", before > 0);

  await page.goto(BASE + "/factory/orders/new", { waitUntil: "networkidle" });
  await page.locator("#clientId").selectOption({ label: "QA Pak Turk" });
  await page.locator("#title").fill("Freshness check order");
  await page.getByRole("button", { name: /Save order/ }).click();
  await page.waitForURL(/\/factory\/orders\/[0-9a-f-]{20,}/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  check("the saved order opens showing what was just saved",
    (await page.locator(".cms-content").innerText()).includes("Freshness check order"));

  // Client-side navigation through the app's own nav — this is the path that
  // could serve a stale cached list now that refresh() is gone.
  await page.getByRole("link", { name: "Orders", exact: true }).first().click();
  await page.waitForURL(/\/factory\/orders$/, { timeout: 20000 });
  // Soft navigation swaps the URL before the server payload paints; wait for
  // the list's own summary line rather than for the network to fall quiet.
  await page.getByText(/pieces\. Expand a client/).waitFor({ timeout: 20000 });
  check("the list counts the new order without a manual refresh", await orderCount() === before + 1);

  // --- 4. Editing an order still shows the edit, which is the case that needs
  // the refresh: the push lands back on a page already in the router cache. ---
  await page.goto(BASE + `/factory/orders/${target.id}`, { waitUntil: "networkidle" });
  await page.locator("#title").fill("Campus furniture renamed");
  await page.getByRole("button", { name: /Save order/ }).click();
  await page.getByText("Campus furniture renamed").first().waitFor({ timeout: 20000 });
  check("saving an edit shows the edited order, not the stale copy",
    (await page.locator(".cms-content").innerText()).includes("Campus furniture renamed"));

  console.log(`\n${checks.length} order-workflow checks passed`);
} catch (error) {
  console.error("FAILED", error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  dev.kill();
  fixture.server.close();
}
