import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { cmsFixture } from "./cms-fixture-server.mjs";

mkdirSync(".verify-cms", { recursive: true });
const fixture = cmsFixture();
await new Promise((r) => fixture.server.listen(0, "127.0.0.1", r));
const fixtureUrl = `http://127.0.0.1:${fixture.server.address().port}`;
const BASE = "http://127.0.0.1:3155";
const log = createWriteStream(".verify-cms/combined-invoice.log");
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3155"], {
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
    await page.waitForSelector("text=This section is locked", { state: "detached" });
  }
  // No selection yet: no combine button should show.
  check("no Generate total invoice button before anything is checked",
    (await page.getByRole("button", { name: /Generate total invoice/ }).count()) === 0);

  // QA Pak Turk has PTF-0001 (Rs 12,000) and PTF-0002 (Rs 22,000).
  const pakTurkSection = page.locator("section", { hasText: "QA Pak Turk" });
  const checkboxes = pakTurkSection.locator('input[type="checkbox"]');
  check("QA Pak Turk has two invoices to select", await checkboxes.count() === 2);
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();

  const combineButton = pakTurkSection.getByRole("button", { name: "Generate total invoice (2)" });
  check("the combine button appears once two rows are checked", await combineButton.isVisible());

  await combineButton.click();
  await page.waitForURL(/\/factory\/invoices\/combined\?ids=/, { timeout: 20000 });
  await page.reload({ waitUntil: "networkidle" });

  const bodyText = await page.locator(".cms-content").innerText();
  check("the combined document shows the right client", bodyText.includes("QA Pak Turk"));
  check("the combined total is the sum, Rs 34,000", bodyText.includes("Rs 34,000"));
  check("the merged items credit their original invoice numbers", bodyText.includes("PTF-0001") && bodyText.includes("PTF-0002"));
  check("the document reads as a combined invoice, not a new numbered one", bodyText.includes("Combined invoice"));

  // Cross-client selection must be refused, not silently mixed.
  const idsUrl = new URL(page.url());
  const [firstId] = idsUrl.searchParams.get("ids").split(",");
  await page.goto(BASE + "/factory/invoices", { waitUntil: "networkidle" });
  const schoolSection = page.locator("section", { hasText: "QA School" });
  const schoolCheckbox = schoolSection.locator('input[type="checkbox"]').first();
  await schoolCheckbox.check();
  const schoolInvoiceId = await schoolSection.locator("a").first().getAttribute("href").then((href) => href.split("/").pop());
  await page.goto(`${BASE}/factory/invoices/combined?ids=${firstId},${schoolInvoiceId}`, { waitUntil: "networkidle" });
  check("mixing two clients is refused with a clear message",
    (await page.locator("body").innerText()).includes("cannot be combined"));

  // Download the PDF for the valid combined invoice and check its contents.
  await page.goto(`${BASE}/factory/invoices/combined?ids=${idsUrl.searchParams.get("ids")}`, { waitUntil: "networkidle" });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PDF" }).click(),
  ]);
  const pdfPath = ".verify-cms/combined-invoice.pdf";
  await download.saveAs(pdfPath);
  const bytes = await readFile(pdfPath);
  check("a real PDF downloaded", bytes.subarray(0, 5).toString() === "%PDF-");
  const raw = bytes.toString("latin1");
  check("the PDF header reads Combined invoice, not Invoice", raw.includes("(Combined invoice)"));
  check("the PDF total is Rs 34,000", raw.includes("34,000"));

  console.log(`\n${checks.length} combined-invoice checks passed`);
} catch (error) {
  console.error("FAILED", error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  dev.kill();
  fixture.server.close();
}
