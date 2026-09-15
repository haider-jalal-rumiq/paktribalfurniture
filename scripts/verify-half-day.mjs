import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { cmsFixture } from "./cms-fixture-server.mjs";

mkdirSync(".verify-cms", { recursive: true });
const fixture = cmsFixture();
await new Promise((r) => fixture.server.listen(0, "127.0.0.1", r));
const fixtureUrl = `http://127.0.0.1:${fixture.server.address().port}`;
const BASE = "http://127.0.0.1:3154";
const log = createWriteStream(".verify-cms/half-day.log");
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3154"], {
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
    try {
      if ((await fetch(BASE + "/factory/login")).ok) break;
    } catch { /* not up yet */ }
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

  await page.goto(BASE + "/factory/expenses/labour/new", { waitUntil: "networkidle" });
  await page.getByLabel("Worker name", { exact: true }).fill("QA Half Day Worker");
  await page.getByLabel("Daily worker", { exact: true }).check();

  await page.locator("#daysWorked").fill("9.5");
  await page.locator("#perDaySalary").fill("1000");
  await page.locator("#otHours").fill("0");
  await page.locator("#otRate").fill("0");
  await page.getByLabel("Amount paid, excluding advances (Rs)", { exact: true }).fill("0");

  check("half-day input accepts a decimal without being blocked", await page.locator("#daysWorked").inputValue() === "9.5");

  const payslip = await page.locator("section", { hasText: "Payslip" }).innerText();
  check("the live payslip shows the half day, not truncated to 9", payslip.includes("9.5"));
  check("the live payslip computes Rs 9,500 for 9.5 x Rs 1,000", payslip.includes("Rs 9,500"));

  await page.getByRole("button", { name: "Save labour entry" }).click();
  await page.waitForURL(/\/factory\/expenses\/labour\?month=/, { timeout: 20000 });
  check("the entry saved (schema + API accepted a decimal days_worked)", true);

  const ledgerText = await page.locator(".cms-content").innerText();
  check("the saved total for a half day is Rs 9,500, not Rs 9,000 or Rs 10,000", ledgerText.includes("QA Half Day Worker") && ledgerText.includes("Rs 9,500"));

  // Round-trip through the database: reopen the entry and confirm 9.5 survives.
  await page.getByText("QA Half Day Worker", { exact: true }).click();
  await page.waitForURL(/\/factory\/expenses\/labour\/[0-9a-f-]+$/, { timeout: 20000 });
  check("9.5 round-trips through save and reload, not rounded to a whole day", await page.locator("#daysWorked").inputValue() === "9.5");

  console.log(`\n${checks.length} half-day checks passed`);
} catch (error) {
  console.error("FAILED", error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  dev.kill();
  fixture.server.close();
}
