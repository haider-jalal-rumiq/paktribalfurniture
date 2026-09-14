import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { cmsFixture } from "./cms-fixture-server.mjs";

mkdirSync(".verify-cms", { recursive: true });
const fixture = cmsFixture();
await new Promise((r) => fixture.server.listen(0, "127.0.0.1", r));
const fixtureUrl = `http://127.0.0.1:${fixture.server.address().port}`;
const BASE = "http://127.0.0.1:3153";
const log = createWriteStream(".verify-cms/expense-categories.log");
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3153"], {
  env: { ...process.env, PTF_CMS_VERIFY: "1", NEXT_PUBLIC_SUPABASE_URL: fixtureUrl, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-fixture-key", NEXT_PUBLIC_SITE_URL: BASE, NEXT_PUBLIC_VAPID_PUBLIC_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
});
dev.stdout.pipe(log);
dev.stderr.pipe(log);

const EXPECTED = ["Hardware", "Kitchen", "Miscellaneous", "Rent", "Bill", "Polish", "Petrol", "Gas", "Others"];
const checks = [];
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); console.log(`PASS ${name}`); };
const signIn = async (page, base) => {
  await page.goto(`${BASE}${base}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email", { exact: true }).fill("qa@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(BASE + base);
};

let browser;
try {
  for (let i = 0; i < 180; i += 1) {
    try { if ((await fetch(BASE + "/factory/login")).ok) break; } catch { /* not up */ }
    if (i === 179) throw new Error("dev server never started");
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));

  await signIn(page, "/factory");
  await page.goto(BASE + "/factory/expenses", { waitUntil: "networkidle" });
  const factoryOptions = await page.$$eval("#expense-category-options option", (els) => els.map((el) => el.getAttribute("value")));
  check("factory expense form has the category datalist", factoryOptions.length === EXPECTED.length);
  check("factory suggestions match exactly", JSON.stringify(factoryOptions) === JSON.stringify(EXPECTED));
  check("factory category input is still free text (no required list value)", await page.locator("#category").getAttribute("list") === "expense-category-options");

  // Typing a value NOT in the list must still be accepted (free text, not an enum).
  await page.locator("#category").fill("A brand new category nobody suggested");
  await page.locator("#amount").fill("500");
  await page.getByRole("button", { name: "Add expense" }).click();
  await page.waitForTimeout(1500);
  check("a custom, non-suggested category still saves", await page.getByText("A brand new category nobody suggested").first().isVisible().catch(() => false));

  const shopPage = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  await signIn(shopPage, "/shop");
  await shopPage.goto(BASE + "/shop/expenses", { waitUntil: "networkidle" });
  const shopOptions = await shopPage.$$eval("#shop-expense-category-options option", (els) => els.map((el) => el.getAttribute("value")));
  check("shop expense form has the category datalist", shopOptions.length === EXPECTED.length);
  check("shop suggestions match exactly", JSON.stringify(shopOptions) === JSON.stringify(EXPECTED));
  await shopPage.close();

  await page.screenshot({ path: ".verify-cms/expense-category-field.png" });

  console.log(`\n${checks.length} expense-category checks passed`);
} catch (error) {
  console.error("FAILED", error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  dev.kill();
  fixture.server.close();
}
