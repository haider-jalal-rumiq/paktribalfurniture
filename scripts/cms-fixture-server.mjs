// A local-only Supabase protocol fixture for exercising the real CMS UI and API.
// Never connects to, or changes, the business database.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

export function cmsFixture() {
  const id = () => randomUUID();
  const stamp = "2026-09-09T12:00:00Z";
  const client = { id: id(), name: "QA Pak Turk", type: "institution", phone: null, address: "Test campus address", notes: null, created_at: stamp, updated_at: stamp };
  const school = { ...client, id: id(), name: "QA School" };
  const item = { id: id(), name: "Dining table", quantity: 2, status: "in_progress", notes: "Test wood finish" };
  const order = { id: id(), order_no: 1, client_id: client.id, title: "Campus furniture", description: "Workshop order", site_label: "Main campus", delivery_address: null, contact_phone: null, total_amount: 250000, order_date: "2026-09-09", expected_date: "2026-09-11", status: "pending", urgent: false, items: [item, { ...item, id: id(), name: "Chairs", quantity: 12, status: "completed" }], image_paths: [], notes: "Delivery notes", created_at: stamp, updated_at: stamp };
  const urgentOrder = { ...order, id: id(), order_no: 2, title: "Urgent reception desk", site_label: "Reception", urgent: true, items: [{ ...item, id: id(), name: "Reception desk" }] };
  const schoolOrder = { ...order, id: id(), order_no: 3, client_id: school.id, title: "Library furniture", description: "Reading room storage", site_label: "Library", expected_date: "2027-12-01", items: [{ ...item, id: id(), name: "Bookcase", quantity: 1, status: "pending", notes: "180 x 90 x 40 cm; walnut stain" }] };
  const invoice = { id: id(), invoice_no: 1, client_id: client.id, client_name: client.name, client_address: client.address, client_phone: null, issued_on: "2026-09-20", items: [
    { id: id(), item: "Dining table", quantity: 1, amount: 8000, source: "Order" },
    { id: id(), item: "Dining chair", quantity: 2, amount: 1500, source: "Stock" },
    { id: id(), item: "Wooden stool", quantity: 1, amount: 1000, source: "Stock" },
  ], total_amount: 12000, notes: "Sample invoice for verification only.", status: "issued", created_at: stamp, updated_at: stamp };
  const db = {
    clients: [client, school], orders: [order, urgentOrder, schoolOrder], expenses: [{ id: id(), spent_on: "2026-09-09", category: "material", amount: 7000, note: "Test expense", order_id: null, created_at: stamp }],
    order_payments: [], balance_entries: [{ id: id(), received_on: "2026-09-09", amount: 100000, note: "Test opening balance", created_at: stamp }],
    labour_entries: [{ id: id(), name: "QA Worker", period: "2026-09-01", paid_on: "2026-09-09", pay_basis: "monthly", salary: 40000, per_day_salary: 1000, days_worked: 0, item_count: 0, item_rate: 0, ot_hours: 0, ot_rate: 0, leave_deduction: 2000, deduction: 0, deduction_notes: null, total_amount: 38000, advance: 10000, salary_paid: 5000, leaves: 2, notes: "Agreed adjustment", created_at: stamp, updated_at: stamp }],
    invoices: [invoice, { ...invoice, id: id(), invoice_no: 2, issued_on: "2026-09-26", items: [{ ...invoice.items[0], quantity: 1, amount: 22000 }], total_amount: 22000 }, { ...invoice, id: id(), invoice_no: 3, client_id: school.id, client_name: school.name, issued_on: "2026-09-27", items: [{ ...invoice.items[0], quantity: 1, amount: 500 }], total_amount: 500 }],
    shop_sales: [], shop_invoices: [], shop_expenses: [], products: [],
  };
  const user = { id: id(), aud: "authenticated", role: "authenticated", email: "qa@example.test", app_metadata: { role: "admin", provider: "email" }, user_metadata: {}, created_at: stamp, identities: [] };
  const token = [Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"), Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now()/1000) + 86400, iat: Math.floor(Date.now()/1000), aud: "authenticated", role: "authenticated", app_metadata: { role: "admin" } })).toString("base64url"), "local-test-signature"].join(".");
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const send = (body, status = 200) => { res.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS" }); res.end(JSON.stringify(body)); };
    if (req.method === "OPTIONS") return send({});
    if (url.pathname === "/auth/v1/token") return send({ access_token: token, refresh_token: "local-test-refresh", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now()/1000)+86400, user });
    if (url.pathname === "/auth/v1/user") return send(user);
    if (url.pathname === "/auth/v1/logout") return send({});
    if (url.pathname === "/rest/v1/rpc/cms_financial_totals") {
      const sum = (rows, fn) => rows.reduce((n, row) => n + BigInt(fn(row)), 0n).toString();
      return send({ added: sum(db.balance_entries, r => r.amount), expenses: sum(db.expenses, r => r.amount), labourPaid: sum(db.labour_entries, r => r.advance + r.salary_paid), sales: sum(db.invoices.filter(r => r.status === "issued"), r => r.total_amount), openOrders: db.orders.filter(r => ["pending", "ready", "in_progress"].includes(r.status)).length });
    }
    const table = url.pathname.split("/").at(-1);
    if (!db[table]) return send({ message: `Unknown fixture table ${table}` }, 404);
    let rows = db[table].filter(row => [...url.searchParams].every(([key, expr]) => {
      if (["select", "order", "offset", "limit", "on_conflict"].includes(key)) return true;
      const [op, ...parts] = expr.split("."); const value = parts.join(".");
      if (op === "eq") return String(row[key]) === value;
      if (op === "gte") return row[key] >= value;
      if (op === "lte") return row[key] <= value;
      if (op === "lt") return row[key] < value;
      if (op === "in") return value.slice(1,-1).split(",").includes(row[key]);
      if (op === "not" && value === "is.null") return row[key] != null;
      return true;
    }));
    if (req.method === "DELETE") { db[table] = db[table].filter(r => !rows.includes(r)); return send(null); }
    if (["POST", "PATCH"].includes(req.method)) {
      let raw = ""; for await (const chunk of req) raw += chunk;
      const data = JSON.parse(raw || "{}");
      if (req.method === "POST") {
        if (data.id && db[table].some(r => r.id === data.id)) rows = [];
        else { const row = { id: id(), created_at: stamp, updated_at: stamp, ...data };
          if (table === "invoices") Object.assign(row, { invoice_no: db.invoices.length + 1, status: "issued" });
          if (table === "orders") Object.assign(row, { order_no: db.orders.length + 1, total_amount: 0 });
          db[table].push(row); rows = [row];
        }
      } else for (const row of rows) Object.assign(row, data);
      if (table === "invoices") for (const row of rows) row.total_amount = row.items.reduce((n, r) => n + r.amount*r.quantity, 0);
    }
    for (const sort of (url.searchParams.get("order") ?? "").split(",").reverse()) {
      const [key, direction] = sort.split(".");
      rows.sort((a,b) => (typeof a[key] === "number" ? a[key]-b[key] : String(a[key]).localeCompare(String(b[key]))) * (direction === "desc" ? -1 : 1));
    }
    const offset = Number(url.searchParams.get("offset") ?? 0), limit = Number(url.searchParams.get("limit") ?? 1000);
    rows = rows.slice(offset, offset + limit).map(row => ({ ...row }));
    if ((url.searchParams.get("select") ?? "").includes("clients(")) rows = rows.map(row => ({ ...row, clients: db.clients.find(c => c.id === row.client_id) ?? null }));
    return send(req.headers.accept?.includes("vnd.pgrst.object") ? rows[0] ?? null : rows, req.method === "POST" ? 201 : 200);
  });
  return { server, db, client, school, order };
}
