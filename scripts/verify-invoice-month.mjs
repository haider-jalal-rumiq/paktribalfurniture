import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { cmsFixture } from "./cms-fixture-server.mjs";

mkdirSync(".verify-cms", { recursive: true });
const fixture = cmsFixture();

// The seeded invoices sit in September 2026; add one in August so filtering
// has something to exclude.
const september = fixture.db.invoices.length;
fixture.db.invoices.push({
  ...fixture.db.invoices[0],
  id: "11111111-2222-4333-8444-555555555555",
  invoice_no: 90,
  issued_on: "2026-08-14",
  total_amount: 7777,
});

await new Promise((r) => fixture.server.listen(0, "127.0.0.1", r));
const fixtureUrl = `http://127.0.0.1:${fixture.server.address().port}`;
const BASE = "http://127.0.0.1:3160";
const log = createWriteStream(".verify-cms/invoice-month.log");
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3160"], {
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

  await page.goto(BASE + "/factory/invoices", { waitUntil: "networkidle" });
  if (await page.getByText("This section is locked").isVisible().catch(() => false)) {
    await page.getByLabel("Password", { exact: true }).fill("1555");
    await page.getByRole("button", { name: "Unlock", exact: true }).click();
    await page.getByRole("heading", { name: "This section is locked" }).waitFor({ state: "detached" });
  }

  const months = await page.$$eval("#invoiceMonth option", (els) => els.map((el) => el.textContent.trim()));
  check("the month filter lists named months", months.includes("September 2026") && months.includes("August 2026"));
  check("it offers an all-months option", months[0] === "All months");
  check("every invoice shows before filtering",
    (await page.locator(".cms-content").innerText()).includes(`${september + 1} issued invoices`));

  // Choosing a month submits on its own and fills the dates beside it.
  await page.getByLabel("Month", { exact: true }).selectOption({ label: "September 2026" });
  await page.waitForURL(/from=2026-09-01/, { timeout: 20000 });
  await page.getByText(/issued invoices in September 2026/).waitFor({ timeout: 20000 });

  check("the URL carries a plain date range, not a new filter kind",
    page.url().includes("from=2026-09-01") && page.url().includes("to=2026-09-30"));
  check("the From and To boxes show the month that was chosen",
    await page.locator("#from").inputValue() === "2026-09-01" && await page.locator("#to").inputValue() === "2026-09-30");
  check("the summary names the month", (await page.locator(".cms-content").innerText()).includes(`${september} issued invoices in September 2026`));
  check("the August invoice is filtered out", !(await page.locator(".cms-content").innerText()).includes("PTF-0090"));
  check("the month stays selected after the page reloads",
    await page.getByLabel("Month", { exact: true }).inputValue() === "2026-09");

  // August has exactly the one invoice.
  await page.getByLabel("Month", { exact: true }).selectOption({ label: "August 2026" });
  await page.getByText(/issued invoices in August 2026/).waitFor({ timeout: 20000 });
  const august = await page.locator(".cms-content").innerText();
  check("August shows only its own invoice", august.includes("1 issued invoices in August 2026") && august.includes("PTF-0090"));
  check("the printed report link follows the same month",
    (await page.getByRole("link", { name: /Print \/ PDF results/ }).getAttribute("href")).includes("from=2026-08-01"));

  // Back to everything.
  await page.getByLabel("Month", { exact: true }).selectOption({ label: "All months" });
  await page.getByText(/· all dates/).waitFor({ timeout: 20000 });
  check("choosing All months clears the dates again",
    await page.locator("#from").inputValue() === "" && await page.locator("#to").inputValue() === "");

  await page.getByLabel("Month", { exact: true }).selectOption({ label: "September 2026" });
  await page.getByText(/issued invoices in September 2026/).waitFor({ timeout: 20000 });
  await page.locator("form").first().screenshot({ path: ".verify-cms/invoice-month-filter.png" });

  console.log(`\n${checks.length} invoice-month checks passed`);
} catch (error) {
  console.error("FAILED", error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  dev.kill();
  fixture.server.close();
}
