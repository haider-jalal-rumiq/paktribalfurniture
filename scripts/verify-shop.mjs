import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { cmsFixture } from "./cms-fixture-server.mjs";

mkdirSync(".verify-cms", { recursive: true });
const fixture = cmsFixture();
await new Promise(r => fixture.server.listen(0, "127.0.0.1", r));
const fixtureUrl = `http://127.0.0.1:${fixture.server.address().port}`;
const BASE = "http://127.0.0.1:3147";
const log = createWriteStream(".verify-cms/shop-repro.log");
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3147"], {
  env: { ...process.env, PTF_CMS_VERIFY: "1", NEXT_PUBLIC_SUPABASE_URL: fixtureUrl, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-fixture-key", NEXT_PUBLIC_SITE_URL: BASE, NEXT_PUBLIC_VAPID_PUBLIC_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
});
dev.stdout.pipe(log); dev.stderr.pipe(log);

const flat = (value) => value.split(String.fromCharCode(10)).filter(Boolean).join(" / ");
const checks = [];
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); console.log(`PASS ${name}`); };
let browser;
try {
  for (let i = 0; i < 180; i++) {
    try { if ((await fetch(BASE + "/shop/login")).ok) break; } catch {}
    if (i === 179) throw new Error("dev server never started");
    await new Promise(r => setTimeout(r, 500));
  }
  browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1200 } })).newPage();
  page.on("pageerror", e => console.log("PAGEERROR", e.message));

  await page.goto(BASE + "/shop/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email", { exact: true }).fill("qa@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(BASE + "/shop");

  await page.goto(BASE + "/shop/invoices/new", { waitUntil: "networkidle" });
  await page.getByLabel("Customer name", { exact: true }).fill("Walk-in customer");
  await page.getByLabel("Discount (%)", { exact: true }).fill("10");
  const addItem = page.getByRole("button", { name: /add (another )?item|add line/i }).first();
  if (await page.locator("[id^=shop-item-]").count() === 0 && await addItem.count()) await addItem.click();
  await page.locator("[id^=shop-item-]").first().fill("Coffee table");
  await page.locator("[id^=shop-source-]").first().fill("Stock");
  await page.locator("[id^=shop-qty-]").first().fill("2");
  await page.locator("[id^=shop-rate-]").first().fill("10000");
  await page.getByRole("button", { name: /save|issue/i }).first().click();
  await page.waitForURL(/shop\/invoices\/[0-9a-f-]{8}/, { timeout: 20000 });
  console.log("INVOICE SAVED", page.url());

  await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
  const tiles = () => page.locator("div.grid.grid-cols-3").first().innerText();
  const panel = () => page.locator("section.mt-4").first().innerText();
  // Rs 10,000 x 2 less the 10% invoice discount, drafted into the ledger.
  check("invoice drafts its sale into the ledger", flat(await tiles()).includes("Rs 18,000 / 1 sold"));
  check("profit waits for the purchase price", flat(await tiles()).includes("1 awaiting cost"));

  const cost = page.getByLabel(/Purchase price for sale/i).locator("visible=true").first();
  await cost.fill("6000");
  await cost.locator("xpath=ancestor::form").getByRole("button", { name: /add|save/i }).click();
  await page.waitForTimeout(5000);
  // Rs 18,000 sale less Rs 6,000 x 2 cost, split 30/70, with no page reload.
  const afterTiles = flat(await tiles()), afterPanel = flat(await panel());
  check("adding the cost updates gross profit", afterTiles.includes("GROSS PROFIT / Rs 6,000"));
  check("adding the cost updates the partner split", afterPanel.includes("Rs 1,800") && afterPanel.includes("Rs 4,200"));
  await page.screenshot({ path: ".verify-cms/shop-after-cost.png", fullPage: true });


  // Now add a shop expense and come back through the app's own links.
  await page.getByRole("link", { name: "manage" }).click();
  await page.waitForURL(/shop\/expenses/, { timeout: 20000 });

  await page.locator("[id=amount], [name=amount]").first().fill("2000");
  const note = page.locator("[id=note], [name=note]").first();
  if (await note.count()) await note.fill("Tea");
  const cat = page.locator("[id=category], [name=category]").first();
  if (await cat.count()) await cat.fill("Misc").catch(() => {});
  await page.getByRole("button", { name: /add|save/i }).first().click();
  await page.waitForTimeout(4000);


  await page.getByRole("link", { name: /^Sales$/ }).first().click();
  await page.waitForURL(/3147\/shop$/, { timeout: 20000 });
  await page.waitForTimeout(2000);
  // The deduction must survive leaving the page and coming back.
  const backPanel = flat(await panel());
  check("expenses stay deducted after navigating away", backPanel.includes("NET PROFIT / Rs 4,000"));
  check("the split follows net profit", backPanel.includes("Rs 1,200") && backPanel.includes("Rs 2,800"));
  // And the factory invoice header must carry the Woodona Heritage number.
  await page.goto(BASE + "/factory/invoices", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /PTF-0001/ }).first().click();
  await page.waitForURL(/factory\/invoices\/[0-9a-f-]{8}/, { timeout: 20000 });
  check("the factory invoice prints the Woodona Heritage number",
    flat(await page.locator(".document-header").innerText()).includes("+92 336 5193323"));
  console.log(`
${checks.length} shop checks passed`);
  process.exitCode = 0;
} catch (error) {
  console.error("FAILED", error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  dev.kill();
  fixture.server.close();
}
