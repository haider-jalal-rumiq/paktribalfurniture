// Measures what actually happens between clicking "Save order" and the saved
// order being on screen: how many server round trips, and how long they take.
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { cmsFixture } from "./cms-fixture-server.mjs";

mkdirSync(".verify-cms", { recursive: true });
const fixture = cmsFixture();
await new Promise((r) => fixture.server.listen(0, "127.0.0.1", r));
const fixtureUrl = `http://127.0.0.1:${fixture.server.address().port}`;
const BASE = "http://127.0.0.1:3158";
const log = createWriteStream(".verify-cms/measure-order-save.log");
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3158"], {
  env: { ...process.env, PTF_CMS_VERIFY: "1", NEXT_PUBLIC_SUPABASE_URL: fixtureUrl, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-fixture-key", NEXT_PUBLIC_SITE_URL: BASE, NEXT_PUBLIC_VAPID_PUBLIC_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
});
dev.stdout.pipe(log);
dev.stderr.pipe(log);

let browser;
try {
  for (let i = 0; i < 180; i += 1) {
    try { if ((await fetch(BASE + "/factory/login")).ok) break; } catch { /* not up */ }
    if (i === 179) throw new Error("dev server never started");
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1200 } })).newPage();

  await page.goto(BASE + "/factory/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email", { exact: true }).fill("qa@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(BASE + "/factory");

  await page.goto(BASE + "/factory/orders/new", { waitUntil: "networkidle" });
  if (await page.getByText("This section is locked").isVisible().catch(() => false)) {
    await page.getByLabel("Password", { exact: true }).fill("1777");
    await page.getByRole("button", { name: "Unlock", exact: true }).click();
    await page.getByRole("heading", { name: "This section is locked" }).waitFor({ state: "detached" });
  }

  // Warm both routes so we measure the save, not Turbopack's first compile.
  await page.goto(BASE + `/factory/orders/${fixture.order.id}`, { waitUntil: "networkidle" });
  await page.goto(BASE + "/factory/orders/new", { waitUntil: "networkidle" });

  await page.getByLabel("Client", { exact: true }).selectOption({ label: "QA Pak Turk" });
  await page.getByLabel("What is being made", { exact: true }).fill("Measured order").catch(async () => {
    await page.locator("#title").fill("Measured order");
  });

  const requests = [];
  page.on("request", (request) => {
    const url = request.url();
    if (!url.startsWith(BASE)) return;
    // Next fetches a route's server payload with _rsc; the API call is the save.
    if (request.resourceType() === "document" || request.resourceType() === "fetch" || url.includes("_rsc")) {
      requests.push({ method: request.method(), url: url.replace(BASE, ""), at: Date.now() });
    }
  });

  const started = Date.now();
  await page.getByRole("button", { name: /Save order/ }).click();
  await page.waitForURL(/\/factory\/orders\/[0-9a-f-]{20,}/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  const elapsed = Date.now() - started;

  const rsc = requests.filter((r) => r.url.includes("_rsc"));
  console.log(`\nclick -> settled: ${elapsed}ms`);
  console.log(`save API calls: ${requests.filter((r) => r.url.includes("/api/")).length}`);
  console.log(`server payload (RSC) fetches after save: ${rsc.length}`);
  for (const r of requests) console.log(`  ${r.method} ${r.url.slice(0, 90)} (+${r.at - started}ms)`);
} catch (error) {
  console.error("FAILED", error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  dev.kill();
  fixture.server.close();
}
