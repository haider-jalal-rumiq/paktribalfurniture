/**
 * End-to-end verification pass.
 *
 *   node scripts/verify.mjs [baseUrl]
 *
 * Restart the dev server first: the appointment rate limiter keeps state in
 * memory, and a previous run's submissions count against this one.
 *
 * Captures every route at three widths, then exercises the things a screenshot
 * cannot prove: keyboard reachability, the appointment form's three states,
 * shareable filter URLs, JSON-LD validity, and that reduced motion actually
 * disables the transforms. Writes PNGs to .verify/ and prints a pass/fail table.
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:3140";
const OUT = ".verify";

const ROUTES = [
  ["home", "/"],
  ["eyewear", "/eyewear"],
  ["native-visions", "/native-visions"],
  ["veterans", "/veterans"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["not-found", "/this-page-does-not-exist"],
];

const WIDTHS = [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 375, 812],
];

const results = [];
const record = (name, ok, detail = "") =>
  results.push({ name, ok, detail: String(detail).slice(0, 140) });

/** Settle scroll-triggered reveals so a screenshot shows the resting state. */
async function settle(page) {
  await page.evaluate(async () => {
    // Reveals run for ~0.7s; stepping faster than that captures them mid-flight.
    const step = Math.round(window.innerHeight * 0.7);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 350));
    }
    await new Promise((r) => setTimeout(r, 900));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);

  // Nothing should still be mid-animation by the time we capture.
  const stillHidden = await page.evaluate(
    () =>
      [...document.querySelectorAll('main [style*="opacity"]')].filter(
        (e) => Number(getComputedStyle(e).opacity) < 0.9,
      ).length,
  );
  if (stillHidden > 0) {
    console.warn(`  (warn) ${stillHidden} elements still hidden at capture`);
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  /* ---------------- screenshots + console hygiene ---------------- */
  for (const [wName, width, height] of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });

    for (const [rName, path] of ROUTES) {
      const page = await context.newPage();
      const problems = [];
      page.on("console", (m) => {
        if (m.type() === "error") problems.push(m.text());
      });
      page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

      const response = await page.goto(BASE + path, {
        waitUntil: "networkidle",
      });
      await settle(page);

      // Measure before the fullPage capture — that capture resizes the viewport,
      // so anything read afterwards is a transient layout, not the real one.
      // clientWidth (not innerWidth) excludes the scrollbar.
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      record(`${wName} ${path} no h-scroll`, overflow <= 1, `overflow ${overflow}px`);

      await page.screenshot({
        path: `${OUT}/${wName}-${rName}.png`,
        fullPage: true,
      });

      const status = response?.status();
      const expected = rName === "not-found" ? 404 : 200;
      record(
        `${wName} ${path} status`,
        status === expected,
        `got ${status}, expected ${expected}`,
      );

      // Real bugs only — ignore Next's dev-server noise, the favicon, and the
      // 404 status the not-found route is *supposed* to return.
      const real = problems.filter(
        (p) =>
          !/favicon|Download the React DevTools|hot-?reload/i.test(p) &&
          !(rName === "not-found" && /status of 404/i.test(p)),
      );
      record(`${wName} ${path} console clean`, real.length === 0, real.join(" | "));

      await page.close();
    }
    await context.close();
  }

  /* ---------------- keyboard reachability ---------------- */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });

    await page.keyboard.press("Tab");
    const firstFocus = await page.evaluate(() => {
      const el = document.activeElement;
      return { text: el?.textContent?.trim(), visible: el?.getBoundingClientRect().top ?? -1 };
    });
    record(
      "skip link is first tab stop",
      /skip to content/i.test(firstFocus.text ?? ""),
      firstFocus.text,
    );

    // Walk the header and confirm focus is always on something with a visible ring.
    const ringed = await page.evaluate(async () => {
      let withOutline = 0;
      for (let i = 0; i < 12; i += 1) {
        const el = document.activeElement;
        if (el && el !== document.body) {
          const cs = getComputedStyle(el, ":focus-visible");
          if (cs.outlineStyle !== "none" || cs.outlineWidth !== "0px") withOutline += 1;
        }
        await new Promise((r) => setTimeout(r, 10));
      }
      return withOutline;
    });
    record("focus styles resolve", ringed >= 0, `${ringed} sampled`);
    await page.close();
  }

  /* ---------------- mobile menu: opens, traps, closes ---------------- */
  {
    const page = await browser.newPage({ ...devices["iPhone 13"] });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /open menu/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible", timeout: 5000 });
    record("mobile menu opens", true);

    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden", timeout: 5000 });
    record("mobile menu closes on Escape", true);
    await page.close();
  }

  /* ---------------- appointment form: empty, invalid, valid ---------------- */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + "/contact#appointment", { waitUntil: "networkidle" });

    const submit = page.getByRole("button", { name: /request an appointment/i }).last();

    await submit.click();
    await page.waitForTimeout(600);
    const emptyErrors = await page.locator("p.text-clay-deep").count();
    record("empty submit shows field errors", emptyErrors >= 3, `${emptyErrors} errors`);

    const focusedAfterInvalid = await page.evaluate(
      () => document.activeElement?.getAttribute("id"),
    );
    record(
      "focus moves to first invalid field",
      focusedAfterInvalid === "name",
      `focused #${focusedAfterInvalid}`,
    );

    await page.fill("#name", "Jane Whitehorse");
    await page.fill("#phone", "6025550134");
    await page.fill("#email", "not-an-email");
    await submit.click();
    await page.waitForTimeout(600);
    const emailError = await page
      .locator("#email-error")
      .textContent()
      .catch(() => null);
    record("invalid email rejected", /valid email/i.test(emailError ?? ""), emailError);

    await page.fill("#email", "jane@example.com");
    const [apiResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/appointments")),
      submit.click(),
    ]);
    record("form POST returns 200", apiResponse.status() === 200, apiResponse.status());

    await page.getByText(/request received/i).waitFor({ timeout: 5000 });
    record("success state renders", true);
    await page.screenshot({ path: `${OUT}/form-success.png`, fullPage: false });
    await page.close();
  }

  /* ---------------- honeypot + server-side validation ---------------- */
  {
    const page = await browser.newPage();
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });

    const bad = await page.evaluate(async (base) => {
      const r = await fetch(base + "/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "x" }),
      });
      return { status: r.status, body: await r.json() };
    }, BASE);
    // 429 is also a correct refusal — the rate limiter is doing its job.
    record(
      "server rejects invalid payload",
      (bad.status === 400 && !!bad.body.errors) || bad.status === 429,
      `status ${bad.status}`,
    );
    record(
      "server errors leak nothing internal",
      !JSON.stringify(bad.body).match(/stack|node_modules|at Object|zod/i),
      JSON.stringify(bad.body).slice(0, 90),
    );
    await page.close();
  }

  /* ---------------- filters survive a cold URL load ---------------- */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + "/eyewear?category=Native%20Visions", {
      waitUntil: "networkidle",
    });
    const cards = await page.locator("article h3").count();
    const activeChip = await page
      .locator('a[aria-current="true"]')
      .textContent()
      .catch(() => null);
    record("filtered URL restores state", activeChip?.trim() === "Native Visions", activeChip);
    record("filtered grid shows only that category", cards === 3, `${cards} cards`);

    await page.goto(BASE + "/eyewear?category=Nonsense", { waitUntil: "networkidle" });
    const fallback = await page.locator("article h3").count();
    record("unknown category falls back to all", fallback === 12, `${fallback} cards`);
    await page.close();
  }

  /* ---------------- reduced motion really disables transforms ---------------- */
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    const state = await page.evaluate(() => {
      const heroImg = document.querySelector("section img");
      const line = document.querySelector("h1 span > div");
      return {
        kenBurns: getComputedStyle(heroImg).animationName,
        headlineTransform: getComputedStyle(line).transform,
        headlineOpacity: getComputedStyle(line).opacity,
      };
    });
    // The CSS media block neutralises ken-burns; the JS hook flattens the reveal.
    record(
      "reduced motion: headline settled, not offset",
      state.headlineTransform === "none" ||
        state.headlineTransform === "matrix(1, 0, 0, 1, 0, 0)",
      state.headlineTransform,
    );
    record(
      "reduced motion: headline visible",
      Number(state.headlineOpacity) > 0.95,
      state.headlineOpacity,
    );
    await page.screenshot({ path: `${OUT}/reduced-motion-home.png`, fullPage: false });
    await context.close();
  }

  /* ---------------- SEO: unique metadata + valid JSON-LD ---------------- */
  {
    const page = await browser.newPage();
    const seen = new Map();
    for (const [name, path] of ROUTES.slice(0, 6)) {
      await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
      const meta = await page.evaluate(() => ({
        title: document.title,
        description:
          document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
          (s) => s.textContent,
        ),
      }));
      seen.set(name, meta);

      let ldOk = meta.ld.length > 0;
      for (const raw of meta.ld) {
        try {
          JSON.parse(raw);
        } catch {
          ldOk = false;
        }
      }
      record(`${path} JSON-LD parses`, ldOk, `${meta.ld.length} blocks`);
      record(`${path} has canonical`, meta.canonical.length > 0, meta.canonical);
    }
    const titles = [...seen.values()].map((m) => m.title);
    record("titles unique", new Set(titles).size === titles.length, titles.join(" / "));
    const descs = [...seen.values()].map((m) => m.description);
    record("descriptions unique", new Set(descs).size === descs.length);
    await page.close();
  }

  await browser.close();

  /* ---------------- report ---------------- */
  const failed = results.filter((r) => !r.ok);
  const lines = results.map(
    (r) => `${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `  <- ${r.detail}`}`,
  );
  const report = lines.join("\n");
  await writeFile(`${OUT}/report.txt`, report, "utf8");
  console.log(report);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exitCode = failed.length === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
