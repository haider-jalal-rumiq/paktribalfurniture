import { chromium, devices } from "playwright";
import { mkdir, rm, writeFile } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:3140";
const OUT = ".verify";

const ROUTES = [
  ["home", "/"],
  ["collections", "/collections"],
  ["beds", "/collections?category=beds"],
  ["custom", "/custom"],
  ["contact", "/contact"],
  ["privacy", "/privacy"],
  ["not-found", "/this-piece-does-not-exist"],
];

const WIDTHS = [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 375, 812],
];

const results = [];
const record = (name, ok, detail = "") => results.push({ name, ok, detail: String(detail).slice(0, 180) });

async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.max(300, Math.round(window.innerHeight * 0.72));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 170));
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const [widthName, width, height] of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, colorScheme: "light" });
    for (const [routeName, path] of ROUTES) {
      const page = await context.newPage();
      const problems = [];
      page.on("console", (message) => { if (message.type() === "error") problems.push(message.text()); });
      page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
      const response = await page.goto(BASE + path, { waitUntil: "networkidle" });
      await settle(page);

      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        h1Count: document.querySelectorAll("h1").length,
        emptyButtons: [...document.querySelectorAll("button")].filter((button) => !(button.textContent?.trim() || button.getAttribute("aria-label"))).length,
      }));
      record(`${widthName} ${path} no horizontal overflow`, metrics.overflow <= 1, `${metrics.overflow}px`);
      record(`${widthName} ${path} has one h1`, metrics.h1Count === 1, metrics.h1Count);
      record(`${widthName} ${path} buttons are named`, metrics.emptyButtons === 0, metrics.emptyButtons);

      await page.screenshot({ path: `${OUT}/${widthName}-${routeName}.png`, fullPage: true });
      const expected = routeName === "not-found" ? 404 : 200;
      record(`${widthName} ${path} status`, response?.status() === expected, `${response?.status()} expected ${expected}`);
      const realProblems = problems.filter((problem) => !/Download the React DevTools|hot-?reload/i.test(problem) && !(routeName === "not-found" && /404/i.test(problem)));
      record(`${widthName} ${path} console clean`, realProblems.length === 0, realProblems.join(" | "));
      await page.close();
    }
    await context.close();
  }

  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim() ?? "", outline: getComputedStyle(document.activeElement).outlineStyle }));
    record("skip link is first tab stop", /skip to content/i.test(focus.text), focus.text);
    record("focused controls have an outline", focus.outline !== "none", focus.outline);
    await page.close();
  }

  {
    const page = await browser.newPage({ ...devices["iPhone 13"], colorScheme: "light" });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /open menu/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible" });
    record("mobile navigation opens as a dialog", true);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    record("mobile navigation closes on Escape", true);
    await page.close();
  }

  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + "/contact#enquiry", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /save and continue to WhatsApp/i }).click();
    await page.waitForTimeout(300);
    const validation = await page.evaluate(() => ({
      errors: document.querySelectorAll('[id$="-error"]').length,
      focused: document.activeElement?.id,
      invalid: document.querySelectorAll('[aria-invalid="true"]').length,
    }));
    record("empty enquiry shows field errors", validation.errors >= 3, validation.errors);
    record("enquiry focuses first invalid field", validation.focused === "name", validation.focused);
    record("invalid enquiry controls expose aria-invalid", validation.invalid >= 3, validation.invalid);
    await page.screenshot({ path: `${OUT}/enquiry-validation.png`, fullPage: false });

    const badResponse = await page.evaluate(async (base) => {
      const response = await fetch(base + "/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "x" }) });
      return { status: response.status, body: await response.json() };
    }, BASE);
    record("server rejects invalid enquiry payload", badResponse.status === 400 || badResponse.status === 429, badResponse.status);
    record("server response leaks no internals", !/stack|node_modules|zod|at Object/i.test(JSON.stringify(badResponse.body)), JSON.stringify(badResponse.body));
    await page.close();
  }

  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + "/collections?category=beds", { waitUntil: "networkidle" });
    const active = await page.locator('a[aria-current="page"]').filter({ hasText: "Beds" }).count();
    const heading = await page.locator("h1").textContent();
    record("category filter survives a cold URL load", active === 1 && heading?.trim() === "Beds", `${active} active, ${heading}`);
    await page.goto(BASE + "/collections?category=unknown", { waitUntil: "networkidle" });
    const fallbackHeading = await page.locator("h1").textContent();
    record("unknown category safely falls back", /Furniture for every part of home/i.test(fallbackHeading ?? ""), fallbackHeading);
    await page.goto(BASE + "/eyewear", { waitUntil: "networkidle" });
    record("legacy eyewear URL redirects", new URL(page.url()).pathname === "/collections", page.url());
    await page.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", colorScheme: "light" });
    const page = await context.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(200);
    const motionState = await page.evaluate(() => {
      const animated = document.querySelector("h1")?.parentElement;
      const image = document.querySelector("section img");
      return { transform: animated ? getComputedStyle(animated).transform : "missing", opacity: animated ? getComputedStyle(animated).opacity : "0", animation: image ? getComputedStyle(image).animationName : "missing" };
    });
    record("reduced motion leaves headline settled", motionState.transform === "none" || motionState.transform === "matrix(1, 0, 0, 1, 0, 0)", motionState.transform);
    record("reduced motion leaves headline visible", Number(motionState.opacity) > 0.95, motionState.opacity);
    record("reduced motion disables image keyframes", motionState.animation === "none", motionState.animation);
    await page.screenshot({ path: `${OUT}/reduced-motion-home.png`, fullPage: false });
    await context.close();
  }

  {
    const page = await browser.newPage();
    const seenTitles = [];
    const seenDescriptions = [];
    for (const [, path] of ROUTES.filter(([name]) => name !== "not-found" && name !== "beds")) {
      await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
      const meta = await page.evaluate(() => ({
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
        jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((script) => script.textContent ?? ""),
      }));
      seenTitles.push(meta.title);
      seenDescriptions.push(meta.description);
      record(`${path} has a canonical URL`, Boolean(meta.canonical), meta.canonical);
      let validJsonLd = meta.jsonLd.length > 0;
      for (const raw of meta.jsonLd) { try { JSON.parse(raw); } catch { validJsonLd = false; } }
      record(`${path} JSON-LD parses`, validJsonLd, `${meta.jsonLd.length} blocks`);
    }
    record("page titles are unique", new Set(seenTitles).size === seenTitles.length, seenTitles.join(" | "));
    record("page descriptions are unique", new Set(seenDescriptions).size === seenDescriptions.length, seenDescriptions.join(" | "));
    await page.close();
  }

  await browser.close();
  const failed = results.filter((result) => !result.ok);
  const report = results.map((result) => `${result.ok ? "PASS" : "FAIL"}  ${result.name}${result.ok ? "" : `  <- ${result.detail}`}`).join("\n");
  await writeFile(`${OUT}/report.txt`, `${report}\n\n${results.length - failed.length}/${results.length} passed\n`, "utf8");
  console.log(report);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exitCode = failed.length === 0 ? 0 : 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
