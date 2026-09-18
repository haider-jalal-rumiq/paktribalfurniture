import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import zlib from "node:zlib";
import { chromium } from "playwright";
import { cmsFixture } from "./cms-fixture-server.mjs";

mkdirSync(".verify-cms", { recursive: true });
const fixture = cmsFixture();
await new Promise((r) => fixture.server.listen(0, "127.0.0.1", r));
const fixtureUrl = `http://127.0.0.1:${fixture.server.address().port}`;
const BASE = "http://127.0.0.1:3152";
const log = createWriteStream(".verify-cms/invoice-pdf.log");
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3152"], {
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
    } catch {
      /* not up yet */
    }
    if (i === 179) throw new Error("dev server never started");
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
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
  await page.getByRole("link", { name: /PTF-0001/ }).first().click();
  await page.waitForURL(/factory\/invoices\/[0-9a-f-]{8}/);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PDF" }).click(),
  ]);
  const pdfPath = ".verify-cms/factory-invoice.pdf";
  await download.saveAs(pdfPath);
  check("PDF downloaded", true);

  const bytes = await readFile(pdfPath);
  check("file is a real PDF", bytes.subarray(0, 5).toString() === "%PDF-");

  const raw = bytes.toString("latin1");
  check("PDF embeds an image (the brand mark)", /\/Subtype\s*\/Image/.test(raw));
  check("the file stays small (logo scaled down, not embedded at full 537x523)", bytes.length < 250_000);

  // jsPDF leaves content streams uncompressed here, so the text operators are
  // literal in the file; fall back to inflating anything that isn't (belt and
  // braces for a future jsPDF version that does compress them).
  const streamPattern = /stream\r?\n([\s\S]*?)endstream/g;
  let text = raw;
  for (const [, s] of raw.matchAll(streamPattern)) {
    try {
      text += zlib.inflateSync(Buffer.from(s, "latin1")).toString("latin1");
    } catch {
      // Not a deflate stream (plain content, or the raw image data) — skip it.
    }
  }
  const tjPattern = new RegExp("\\(((?:[^()\\\\]|\\\\.)*)\\)\\s*Tj", "g");
  const words = [...text.matchAll(tjPattern)].map((m) => m[1]);
  const joined = words.join(" | ");
  check("PDF text includes WOODONA", joined.includes("WOODONA"));
  check("PDF text includes HERITAGE", joined.includes("HERITAGE"));
  check("PDF text includes the Woodona Heritage number", joined.includes("+92 336 5193323"));
  check("PDF text does NOT include the shop's WhatsApp number", !joined.includes("+92 330 1555999"));

  console.log(`\n${checks.length} invoice-PDF checks passed`);
} catch (error) {
  console.error("FAILED", error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  dev.kill();
  fixture.server.close();
}
