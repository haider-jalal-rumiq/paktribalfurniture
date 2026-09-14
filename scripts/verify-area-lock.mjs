import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { cmsFixture } from "./cms-fixture-server.mjs";

mkdirSync(".verify-cms", { recursive: true });
const fixture = cmsFixture();
await new Promise(r => fixture.server.listen(0, "127.0.0.1", r));
const fixtureUrl = `http://127.0.0.1:${fixture.server.address().port}`;
const BASE = "http://127.0.0.1:3148";
const log = createWriteStream(".verify-cms/area-lock.log");
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3148"], {
  env: { ...process.env, PTF_CMS_VERIFY: "1", NEXT_PUBLIC_SUPABASE_URL: fixtureUrl, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-fixture-key", NEXT_PUBLIC_SITE_URL: BASE, NEXT_PUBLIC_VAPID_PUBLIC_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
});
dev.stdout.pipe(log); dev.stderr.pipe(log);

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
  for (let i = 0; i < 180; i++) {
    try { if ((await fetch(BASE + "/factory/login")).ok) break; } catch {}
    if (i === 179) throw new Error("dev server never started");
    await new Promise(r => setTimeout(r, 500));
  }
  browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  page.on("pageerror", e => console.log("PAGEERROR", e.message));

  await signIn(page, "/factory");

  // Open tabs render straight through, no PIN screen.
  await page.goto(BASE + "/factory/inventory", { waitUntil: "networkidle" });
  check("factory inventory has no PIN screen", !(await page.getByText("This section is locked").isVisible().catch(() => false)));
  await page.goto(BASE + "/factory/expenses", { waitUntil: "networkidle" });
  check("factory expenses has no PIN screen", !(await page.getByText("This section is locked").isVisible().catch(() => false)));

  // A locked tab shows the PIN screen, direct URL included.
  await page.goto(BASE + "/factory/orders", { waitUntil: "networkidle" });
  check("factory orders is locked by default", await page.getByText("This section is locked").isVisible());

  // Wrong PIN stays locked and says so.
  await page.getByLabel("Password", { exact: true }).fill("0000");
  await page.getByRole("button", { name: "Unlock" }).click();
  check("wrong PIN is rejected", await page.getByText("Wrong password.").isVisible());

  // Correct PIN unlocks this tab, and every other locked tab too.
  await page.getByLabel("Password", { exact: true }).fill("1555");
  await page.getByRole("button", { name: "Unlock" }).click();
  await page.waitForSelector("text=This section is locked", { state: "detached" });
  check("correct PIN unlocks orders", await page.getByRole("heading", { name: "Orders" }).isVisible());

  await page.goto(BASE + "/factory/clients", { waitUntil: "networkidle" });
  check("the unlock carries to clients without re-entering the PIN", !(await page.getByText("This section is locked").isVisible().catch(() => false)));

  await page.goto(BASE + "/factory", { waitUntil: "networkidle" });
  check("the unlock carries to the factory home tab", !(await page.getByText("This section is locked").isVisible().catch(() => false)));

  // Relock via the strip, and it takes effect immediately on the same page.
  await page.getByRole("button", { name: "Lock", exact: true }).click();
  check("the Lock control relocks the current page immediately", await page.getByText("This section is locked").isVisible());

  await page.goto(BASE + "/factory/clients", { waitUntil: "networkidle" });
  check("relocking factory affects every other locked tab too", await page.getByText("This section is locked").isVisible());
  await page.goto(BASE + "/factory/inventory", { waitUntil: "networkidle" });
  check("inventory is unaffected by the lock/unlock state", !(await page.getByText("This section is locked").isVisible().catch(() => false)));

  // A brand new tab (no sessionStorage carried over) is locked again.
  const page2 = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  await signIn(page2, "/factory");
  await page2.goto(BASE + "/factory/orders", { waitUntil: "networkidle" });
  check("a fresh browser tab is locked again", await page2.getByText("This section is locked").isVisible());
  await page2.close();

  // Shop: invoices and expenses open, sales locked.
  const shopPage = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  await signIn(shopPage, "/shop");
  await shopPage.goto(BASE + "/shop/invoices", { waitUntil: "networkidle" });
  check("shop invoices has no PIN screen", !(await shopPage.getByText("This section is locked").isVisible().catch(() => false)));
  await shopPage.goto(BASE + "/shop/expenses", { waitUntil: "networkidle" });
  check("shop expenses has no PIN screen", !(await shopPage.getByText("This section is locked").isVisible().catch(() => false)));
  await shopPage.goto(BASE + "/shop", { waitUntil: "networkidle" });
  check("shop sales is locked by default", await shopPage.getByText("This section is locked").isVisible());
  await shopPage.getByLabel("Password", { exact: true }).fill("1555");
  await shopPage.getByRole("button", { name: "Unlock" }).click();
  await shopPage.waitForSelector("text=This section is locked", { state: "detached" });
  check("shop sales unlocks with the same PIN", await shopPage.getByRole("heading", { name: "Shop sales" }).isVisible());
  await shopPage.close();

  // Screenshots for a quick visual check. Deterministic: force-lock, shoot,
  // unlock, shoot, then a page with the nav's lock badges.
  await page.goto(BASE + "/factory/orders", { waitUntil: "networkidle" });
  if (await page.getByRole("button", { name: "Lock", exact: true }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Lock", exact: true }).click();
  }
  await page.screenshot({ path: ".verify-cms/area-lock-screen.png" });
  await page.getByLabel("Password", { exact: true }).fill("1555");
  await page.getByRole("button", { name: "Unlock", exact: true }).click();
  await page.waitForSelector("text=This section is locked", { state: "detached" });
  await page.screenshot({ path: ".verify-cms/area-lock-unlocked-strip.png" });
  await page.goto(BASE + "/factory/inventory", { waitUntil: "networkidle" });
  await page.screenshot({ path: ".verify-cms/area-lock-nav-badges.png" });

  console.log(`\n${checks.length} area-lock checks passed`);
} catch (error) {
  console.error("FAILED", error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  dev.kill();
  fixture.server.close();
}
