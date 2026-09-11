import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { cmsFixture } from "./cms-fixture-server.mjs";

const OUT = ".verify-cms";
await mkdir(OUT, { recursive: true });
const fixture = cmsFixture();
await new Promise(resolve => fixture.server.listen(0, "127.0.0.1", resolve));
const fixtureUrl = `http://127.0.0.1:${fixture.server.address().port}`;
const BASE = "http://127.0.0.1:3146";
const log = createWriteStream(`${OUT}/server.log`);
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3146"], {
  env: { ...process.env, PTF_CMS_VERIFY: "1", NEXT_PUBLIC_SUPABASE_URL: fixtureUrl, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-fixture-key", NEXT_PUBLIC_SITE_URL: BASE, NEXT_PUBLIC_VAPID_PUBLIC_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
});
dev.stdout.pipe(log); dev.stderr.pipe(log);
let browser;
const results = [];
const check = (name, condition) => { assert.ok(condition, name); results.push(name); console.log(`PASS ${name}`); };
async function go(page, path) { await page.goto(BASE + path, { waitUntil: "networkidle" }); }
async function openDisclosure(details) {
  if (!await details.evaluate(element => element.open)) await details.locator(":scope > summary").click();
}
async function savePdf(page, filename) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll(".ptf-document img")].map(image => image.decode().catch(() => {})));
  });
  // Chromium's streamed PDF transport can fail with IO.read on Windows.
  // Request the same print output inline instead of using a protocol stream.
  const session = await page.context().newCDPSession(page);
  try {
    const { data } = await session.send("Page.printToPDF", { transferMode: "ReturnAsBase64", printBackground: true, preferCSSPageSize: true });
    await writeFile(`${OUT}/${filename}`, Buffer.from(data, "base64"));
  } finally { await session.detach(); }
}
try {
  for (let i = 0; i < 120; i++) {
    try { const response = await fetch(BASE + "/factory/login"); if (response.ok) break; } catch {}
    if (i === 119) throw new Error("Fixture app did not start; see server.log");
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark" });
  const page = await context.newPage();
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  for (const route of ["balances", "invoices", "labour", "orders", "expenses"]) {
    const response = await context.request.post(`${BASE}/api/cms/${route}`, { data: {} });
    check(`${route} rejects unauthenticated writes`, response.status() === 401);
  }
  await go(page, "/factory/login");
  await page.getByLabel("Email", { exact: true }).fill("qa@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(BASE + "/factory");
  await page.getByText("Rs 78,000", { exact: true }).waitFor();
  check("Credit subtracts general expenses and paid labour", true);
  check("Invoices contribute to sales", await page.getByText("Rs 34,500", { exact: true }).count() === 1);
  check("Dark system preference still renders white", await page.evaluate(() => getComputedStyle(document.body).backgroundColor === "rgb(255, 255, 255)" && getComputedStyle(document.documentElement).colorScheme === "light"));
  await page.screenshot({ path: `${OUT}/dashboard-desktop.png`, fullPage: true });
  await go(page, "/factory/orders");
  const clientSummary = page.locator(".order-client > summary").filter({ hasText: "QA Pak Turk" });
  await clientSummary.click();
  const orderSummaries = page.locator(".order-client[open] .order-branch > summary");
  check("Orders are listed from #1 to #2", await orderSummaries.nth(0).innerText().then(text => text.includes("#1")) && await orderSummaries.nth(1).innerText().then(text => text.includes("#2")));
  check("Client names have strong emphasis", await clientSummary.getByText("QA Pak Turk", { exact: true }).evaluate(element => Number(getComputedStyle(element).fontWeight) >= 700));
  await page.getByRole("link", { name: "Urgent orders", exact: true }).click();
  await page.waitForURL(`${BASE}/factory/orders?urgent=1`);
  await openDisclosure(page.locator(".order-client").filter({ hasText: "QA Pak Turk" }));
  const urgentOrderSummaries = await page.locator(".order-branch > summary").allInnerTexts();
  check("Urgent orders button shows urgent orders only", urgentOrderSummaries.length === 1 && urgentOrderSummaries[0].includes("#2 · Urgent reception desk"));
  await page.screenshot({ path: `${OUT}/orders-urgent-desktop.png`, fullPage: true });
  await page.getByRole("link", { name: "Show all orders", exact: true }).click();
  await page.waitForURL(`${BASE}/factory/orders`);
  await openDisclosure(page.locator(".order-client").filter({ hasText: "QA Pak Turk" }));
  await page.locator(".order-branch > summary").first().click();
  check("Three-level hierarchy expands to item statuses", await page.getByText("Chairs", { exact: false }).isVisible() && await page.locator(".order-branch ol").getByText("Completed", { exact: true }).isVisible());
  await page.screenshot({ path: `${OUT}/orders-desktop.png`, fullPage: true });
  await go(page, `/factory/orders/${fixture.order.id}`);
  check("Orders contain no money or payment controls", !/Order total|Balance due|Paid in full|Payments/.test(await page.locator("main").innerText()));
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await page.getByLabel("Item name", { exact: true }).last().fill("Test cabinet");
  await page.getByLabel("Item status", { exact: true }).last().selectOption("completed");
  await page.getByRole("button", { name: "Save order", exact: true }).click();
  await page.getByText("Saved — opening", { exact: true }).waitFor();
  await go(page, "/factory/orders");
  check("Item additions persist through the order API", fixture.db.orders[0].items.length === 3 && fixture.db.orders[0].items[2].status === "completed");
  check("Legacy order amounts are preserved", fixture.db.orders[0].total_amount === 250000);
  const retired = await context.request.post(`${BASE}/api/cms/orders/${fixture.order.id}/payments`, { data: { amount: 5 } });
  check("Legacy payment endpoint cannot add money to orders", retired.status() === 410);
  await go(page, "/factory/balances");
  await page.getByLabel("Amount to add (Rs)", { exact: true }).fill("5000");
  await page.getByLabel("Description", { exact: true }).fill("QA received funds");
  await page.getByRole("button", { name: "Add balance", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Balance added" }).waitFor();
  check("Balance addition is saved once", fixture.db.balance_entries.length === 2);
  await page.getByLabel("Amount to add (Rs)", { exact: true }).fill("900");
  await page.getByLabel("Description", { exact: true }).fill("QA failed save");
  await page.route("**/api/cms/balances", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Please try again." }) }));
  await page.getByRole("button", { name: "Add balance", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Please try again." }).waitFor();
  check("Failed saves show a usable error and re-enable submit", await page.getByRole("button", { name: "Add balance", exact: true }).isEnabled() && fixture.db.balance_entries.length === 2);
  await page.unroute("**/api/cms/balances");
  await go(page, "/factory/expenses");
  check("Against order is removed", await page.getByLabel("Against order").count() === 0);
  check("Expense category is free text", await page.getByLabel("Category", { exact: true }).evaluate(el => el.tagName) === "INPUT");
  await page.getByLabel("Amount (Rs)", { exact: true }).fill("1000");
  await page.getByLabel("Category", { exact: true }).fill("Custom transport");
  await page.getByRole("button", { name: "Add expense", exact: true }).click();
  await page.getByText("Custom transport", { exact: true }).waitFor();
  check("Custom categories are saved", fixture.db.expenses.some(row => row.category === "Custom transport"));
  await go(page, "/factory/expenses/labour/new?month=2026-09");
  await page.getByLabel("Worker name").fill("QA Second Worker");
  check("Labour form offers monthly, daily, and per-item pay", await page.getByRole("radio").count() === 3);
  await page.getByLabel("Monthly salary (Rs)", { exact: true }).fill("12000");
  await page.getByLabel("Per-day salary (Rs)", { exact: true }).fill("1000");
  await page.getByLabel("Leaves (days)").fill("1");
  await page.getByLabel("No. of overtime hours").fill("2");
  await page.getByLabel("Rate per overtime hour (Rs)").fill("500");
  await page.getByLabel("Advance paid (Rs)", { exact: true }).fill("2000");
  await page.getByLabel("Amount paid, excluding advance (Rs)").fill("1000");
  check("Monthly pay includes overtime and deducts leave", await page.getByText("Rs 9,000", { exact: true }).count() === 1);
  await page.getByLabel("Daily worker").check();
  await page.getByLabel("No. of days worked").fill("6");
  await page.getByLabel("Rate per day (Rs)").fill("1500");
  check("Daily pay multiplies days by the daily rate", await page.getByText("Rs 7,000", { exact: true }).count() === 1);
  await page.getByLabel("Work per item").check();
  await page.getByLabel("No. of items completed").fill("8");
  await page.getByLabel("Rate per item (Rs)").fill("1200");
  check("Per-item pay multiplies items by the item rate", await page.getByText("Rs 7,600", { exact: true }).count() === 1);
  await page.screenshot({ path: `${OUT}/labour-form-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  check("Labour form fits a 375px mobile screen", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: `${OUT}/labour-form-mobile.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Save labour entry", exact: true }).click();
  await page.waitForURL(/\/factory\/expenses\/labour\?month/);
  check("Labour entry persists with its selected basis", fixture.db.labour_entries.length === 2 && fixture.db.labour_entries.at(-1).pay_basis === "per_item" && fixture.db.labour_entries.at(-1).total_amount === 10600);
  await go(page, "/factory/invoices/new");
  await page.getByLabel("Client", { exact: true }).selectOption(fixture.client.id);
  await page.getByRole("button", { name: "Add invoice item", exact: true }).click();
  await page.getByLabel("Item", { exact: true }).fill("QA wardrobe");
  await page.getByLabel("Stock / order", { exact: true }).fill("Stock");
  await page.getByLabel("Quantity", { exact: true }).fill("2");
  await page.getByLabel("Unit amount (Rs)", { exact: true }).fill("2500");
  check("Invoice form multiplies quantity correctly", await page.getByText("Rs 5,000", { exact: true }).count() === 1);
  await page.getByRole("button", { name: "Save invoice", exact: true }).click();
  await page.waitForURL(/\/factory\/invoices\/[0-9a-f-]+$/);
  const created = fixture.db.invoices.at(-1);
  check("Invoice snapshots client branding details", created.total_amount === 5000 && created.client_name === fixture.client.name);
  const replay = await context.request.post(`${BASE}/api/cms/invoices`, { data: { id: created.id, clientId: created.client_id, issuedOn: created.issued_on, notes: "", items: created.items } });
  check("Invoice retries do not create duplicate sales", replay.ok() && fixture.db.invoices.length === 4);
  await go(page, "/factory");
  await page.getByText("Rs 79,000", { exact: true }).waitFor();
  check("Invoices increase sales without increasing Credit", await page.getByText("Rs 39,500", { exact: true }).count() === 1);
  await go(page, `/factory/invoices/${created.id}/edit`);
  await page.getByLabel("Unit amount (Rs)", { exact: true }).fill("4000");
  await page.getByRole("button", { name: "Save invoice", exact: true }).click();
  await page.waitForURL(`${BASE}/factory/invoices/${created.id}`);
  check("Editing an invoice updates its total", created.total_amount === 8000);
  const voided = await context.request.patch(`${BASE}/api/cms/invoices/${created.id}`, { data: { status: "void" } });
  check("Voiding preserves invoice record", voided.ok() && created.status === "void" && fixture.db.invoices.length === 4);
  await go(page, "/factory");
  check("Voided invoices are excluded from sales", await page.getByText("Rs 34,500", { exact: true }).count() === 1);
  await go(page, `/factory/invoices?client=${fixture.client.id}&from=2026-09-20&to=2026-09-26`);
  check("Client and inclusive date filters include both boundaries", await page.getByText("PTF-0001", { exact: true }).count() === 1 && await page.getByText("PTF-0002", { exact: true }).count() === 1 && await page.getByText("PTF-0003", { exact: true }).count() === 0);
  await page.screenshot({ path: `${OUT}/invoices-desktop.png`, fullPage: true });
  await go(page, "/factory/invoices?from=2026-09-27&to=2026-09-20");
  check("Reversed date range shows an error", await page.getByRole("alert").filter({ hasText: "The From date" }).isVisible());
  const badInvoice = await context.request.post(`${BASE}/api/cms/invoices`, { data: { id: crypto.randomUUID(), clientId: fixture.client.id, issuedOn: "2026-02-30", items: [] } });
  check("Invalid calendar date and empty invoice rejected", badInvoice.status() === 400);
  const badLabour = await context.request.post(`${BASE}/api/cms/labour`, { data: { id: crypto.randomUUID(), name: "QA invalid", period: "2026-09", paidOn: "2026-09-09", salary: 100, totalAmount: 100, advance: 90, salaryPaid: 90, leaves: 0 } });
  check("Overpaid labour rejected", badLabour.status() === 400);
  const backup = await (await context.request.get(`${BASE}/api/cms/export`)).json();
  check("Backup includes invoices, balances, labour and embedded order items", backup.version === 3 && backup.invoices.length === 4 && backup.balance_entries.length === 2 && backup.labour_entries.length === 2 && backup.orders[0].items.length === 3);
  for (const [name, path] of [["invoice", `/factory/invoices/${fixture.db.invoices[0].id}`], ["order", `/factory/orders/${fixture.order.id}/print`], ["labour", "/factory/expenses/labour/print?month=2026-09"]]) {
    await go(page, path); await page.locator(".ptf-document img").waitFor();
    await page.screenshot({ path: `${OUT}/${name}-print-preview.png`, fullPage: true });
    await page.emulateMedia({ media: "print" });
    check(`${name} print hides app navigation`, await page.locator(".cms-navigation").isHidden());
    check(`${name} print retains logo`, await page.locator(".ptf-document img").isVisible());
    await savePdf(page, `${name}.pdf`);
    await page.emulateMedia({ media: null });
  }
  await go(page, `/factory/invoices/print?client=${fixture.client.id}&from=2026-09-20&to=2026-09-26`);
  check("Filtered print report includes only the two matching invoices", await page.locator(".ptf-document").count() === 3);
  await page.emulateMedia({ media: "print" });
  await savePdf(page, "invoice-report.pdf");
  const savedItems = fixture.db.invoices[0].items;
  const savedTotal = fixture.db.invoices[0].total_amount;
  fixture.db.invoices[0].items = Array.from({ length: 60 }, (_, index) => ({ id: crypto.randomUUID(), item: `Furniture item ${String(index + 1).padStart(2, "0")} with workshop finish and delivery details`, quantity: 1, amount: 1000, source: "Order" }));
  fixture.db.invoices[0].total_amount = 60000;
  await go(page, `/factory/invoices/${fixture.db.invoices[0].id}`);
  await page.emulateMedia({ media: "print" });
  await savePdf(page, "invoice-long.pdf");
  check("Long invoice print includes every item and total", await page.locator(".invoice-table tbody tr").count() === 60 && await page.locator(".document-total").innerText().then(text => text.includes("60,000")));
  fixture.db.invoices[0].items = savedItems;
  fixture.db.invoices[0].total_amount = savedTotal;
  await page.emulateMedia({ media: null });
  await page.setViewportSize({ width: 375, height: 812 });
  for (const [name, path] of [["dashboard", "/factory"], ["orders", "/factory/orders"], ["invoices", "/factory/invoices"], ["labour", "/factory/expenses/labour?month=2026-09"], ["invoice", `/factory/invoices/${fixture.db.invoices[0].id}`]]) {
    await go(page, path);
    if (name === "orders") { await page.locator(".order-client > summary").filter({ hasText: "QA Pak Turk" }).click(); await page.locator(".order-branch > summary").first().click(); }
    check(`${name} fits a 375px mobile screen`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: `${OUT}/${name}-mobile.png`, fullPage: true });
  }
  check("No client runtime exceptions", errors.length === 0);
  await writeFile(`${OUT}/report.txt`, `${results.length} passed, 0 failed\n\n${results.join("\n")}\n`);
  console.log(`CMS verification: ${results.length} passed, 0 failed`);
} finally {
  if (browser) await browser.close();
  dev.kill(); fixture.server.close(); log.end();
  const config = JSON.parse(await readFile("tsconfig.json", "utf8"));
  config.include = config.include.filter(path => !path.startsWith(".verify-cms/"));
  await writeFile("tsconfig.json", JSON.stringify(config, null, 2) + "\n");
}
