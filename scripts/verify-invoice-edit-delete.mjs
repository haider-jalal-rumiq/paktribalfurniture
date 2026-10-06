import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { cmsFixture } from "./cms-fixture-server.mjs";

mkdirSync(".verify-cms", { recursive: true });
const fixture = cmsFixture();
await new Promise((r) => fixture.server.listen(0, "127.0.0.1", r));
const fixtureUrl = `http://127.0.0.1:${fixture.server.address().port}`;
const BASE = "http://127.0.0.1:3161";
const log = createWriteStream(".verify-cms/invoice-edit-delete.log");
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3161"], {
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
  page.on("dialog", (dialog) => dialog.accept());   // the delete confirmation

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

  const started = fixture.db.invoices.length;
  const row = (no) => page.locator("li", { hasText: no });

  // --- Edit, straight from the list. ---
  check("each list row offers Edit", await row("PTF-0001").getByRole("link", { name: /Edit/ }).count() === 1);
  check("each list row offers Delete", await row("PTF-0001").getByRole("button", { name: "Delete" }).count() === 1);

  await row("PTF-0001").getByRole("link", { name: /Edit/ }).click();
  await page.waitForURL(/\/factory\/invoices\/[0-9a-f-]+\/edit$/, { timeout: 20000 });
  await page.locator("[id^=rate-]").first().waitFor({ timeout: 20000 });
  check("Edit opens that invoice's edit form, with its lines loaded",
    await page.locator("[id^=rate-]").count() > 0);

  // Change an amount and save; the stored invoice must follow.
  const target = fixture.db.invoices.find((invoice) => invoice.invoice_no === 1);
  const before = target.total_amount;
  await page.locator("[id^=rate-]").first().fill("9999");
  await page.getByRole("button", { name: /Save invoice/ }).click();
  await page.waitForURL(/\/factory\/invoices\/[0-9a-f-]+$/, { timeout: 20000 });
  for (let i = 0; i < 40 && fixture.db.invoices.find((x) => x.invoice_no === 1).total_amount === before; i += 1) {
    await new Promise((r) => setTimeout(r, 250));
  }
  check("editing an invoice saves the new amount",
    fixture.db.invoices.find((x) => x.invoice_no === 1).total_amount !== before);

  // --- Delete from the invoice page, alongside Void. ---
  check("the invoice page offers both voiding and deleting",
    await page.getByRole("button", { name: "Void invoice" }).count() === 1
    && await page.getByRole("button", { name: "Delete invoice" }).count() === 1);

  await page.getByRole("button", { name: "Delete invoice" }).click();
  // RecordAction redirects client-side, so there is no page load to wait on.
  for (let i = 0; i < 40 && fixture.db.invoices.length === started; i += 1) {
    await new Promise((r) => setTimeout(r, 250));
  }
  check("deleting removes the invoice from the books", fixture.db.invoices.length === started - 1);
  check("it is the right one that went", !fixture.db.invoices.some((x) => x.invoice_no === 1));

  await page.goto(BASE + "/factory/invoices", { waitUntil: "networkidle" });
  check("the list no longer shows it", !(await page.locator(".cms-content").innerText()).includes("PTF-0001"));

  // --- Delete from the list row itself. ---
  const remaining = fixture.db.invoices.length;
  await row("PTF-0002").getByRole("button", { name: "Delete" }).click();
  for (let i = 0; i < 40 && fixture.db.invoices.length === remaining; i += 1) {
    await new Promise((r) => setTimeout(r, 250));
  }
  check("deleting from the list works too", fixture.db.invoices.length === remaining - 1);

  // --- A voided invoice offers no Edit, because the save would refuse it. ---
  await page.goto(BASE + "/factory/invoices?status=void", { waitUntil: "networkidle" });
  const voided = fixture.db.invoices[0];
  voided.status = "void";
  await page.reload({ waitUntil: "networkidle" });
  const voidRow = page.locator("li", { hasText: `PTF-000${voided.invoice_no}` });
  check("a voided invoice shows no Edit", await voidRow.getByRole("link", { name: /Edit/ }).count() === 0);
  check("a voided invoice can still be deleted", await voidRow.getByRole("button", { name: "Delete" }).count() === 1);

  console.log(`\n${checks.length} invoice edit/delete checks passed`);
} catch (error) {
  console.error("FAILED", error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  dev.kill();
  fixture.server.close();
}
