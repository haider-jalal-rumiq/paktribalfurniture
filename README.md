# Pak Tribal Furniture

An animated, responsive furniture catalogue built with Next.js 16, React 19, Tailwind CSS 4, Motion, and Supabase.

## What is included

- Eight furniture collections and five wood choices
- CMS-managed products with multiple photos, drafts, publishing, and featured placement
- Customer enquiries saved to Supabase before a prefilled WhatsApp handoff
- A protected Studio dashboard for products and recent enquiries
- A protected business CMS at `/factory` for clients, orders, payments and workshop
  expenses, installable on a phone as a PWA with due-date push notifications
- Responsive light and dark color systems with reduced-motion support

## Local setup

Use Node.js 22 or newer.

```bash
npm install
copy .env.example .env.local
npm run dev
```

The public catalogue works without Supabase, but products stay empty and enquiry submissions show a direct WhatsApp fallback until the database is connected.

## Supabase setup

1. Create a dedicated Supabase project for Pak Tribal Furniture. Do not reuse an unrelated production project.
2. Open the SQL editor and run `supabase/schema.sql` once. It creates the tables, indexes, row-level security policies, explicit Data API grants, and the `product-images` Storage bucket.
   Then run `supabase/cms-schema.sql` for the business CMS: clients, orders, payments, expenses, push subscriptions, and the private `order-images` and `backups` buckets.
   Then run `supabase/shop-schema.sql` for the shop ledger: counter sales, shop invoices and shop expenses. It reuses helpers created by the two files above, so run it last. Both CMS files are additive and safe to re-run on an existing database.
3. Copy the project URL and publishable key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Keep public email signups disabled in Supabase Auth.
5. Create the owner account in Authentication, then assign this account the admin role in its `app_metadata`:

```json
{ "role": "admin" }
```

Only `app_metadata` is trusted for authorization. Never put an admin role in user-editable metadata and never expose a secret or service-role key to the browser.

The product catalogue tool is at `/studio`; public products appear only when their `published` switch is enabled. The factory system is at `/factory` and the shop ledger at `/shop`.

## Shop ledger (`/shop`)

The showroom's own book, separate from the factory orders in `/factory`. Same admin
login.

- **Invoices come first.** Save an invoice and every line is drafted into
  Sales with its billed price. Each draft needs only the purchase price; enter
  it in the ledger and profit and margin appear. A draft counts towards sales
  but not profit until then, so the partner split is never flattered by stock
  whose cost is unknown.
- **Invoices** are headed PAK TRIBAL FURNITURE and take a typed customer name,
  so a counter sale needs no client record. **Discount is a percentage** of the
  line subtotal, spread across the lines at the same rate.
- **A manual sale** is for stock sold without an invoice: enter the purchase
  price, the margin (40% by default) and a discount percentage. Rs 10,000 at
  40% is marked Rs 14,000; 5% off sells it for Rs 13,300 at Rs 3,300 profit.
- **A return** keeps its row and drops out of both sales and profit. Undo it
  from the same row if the customer changes their mind.
- **Expenses** are the shop's own — rent, labour, transport. **Calculate
  expense** deducts them from gross profit and splits the net between the two
  partners at 30% and 70%. The factory's expenses in `/factory` are a separate
  book and are never counted here.

## Factory (`/factory`)

Clients, production orders, invoices, available business funds and workshop
expenses. Same admin login as Studio. The whole site stays in white/light mode.

For an existing installation, apply `supabase/cms-operations.sql` once. Fresh
installations use `cms-schema.sql`, which includes the same upgrade. Existing
order amounts, payment records and old expense links are preserved for exports.

- **Dashboard:** Credit = added balances minus general expenses and paid labour.
  Add an opening balance or received funds through **Add balance**. Total sales
  is the sum of issued invoices. Creating an invoice does not add cash to Credit.
- **Orders:** expand client → order → items. Each item has a quantity and status;
  the overall order status is set separately. Orders have no price/payment inputs.
  Older orders initially have no separate items; add them when editing the order.
- **Expenses:** type any category. Expenses no longer need an order link.
- **Labour sheet:** one editable entry per worker/pay period, with salary, agreed
  total, advance paid, additional salary paid, leave days, and derived balance.
  Leaves do not automatically deduct salary. Advance + salary paid count toward
  expenses, using the entry's payment date. Updating cumulative payments moves
  that entry's paid amount to its selected payment date; use separate entries
  when payments need to be allocated to separate dates. Do not also enter the same
  labour payment in general expenses. Historical general labour expenses remain
  in the general expense total and are not copied into the new labour sheet.
- **Invoices:** item, quantity, unit amount, free-text stock/order source and
  calculated total. Client details are snapshotted. Edit issued invoices or void
  them while retaining the record. Voided invoices are excluded from Total sales.
  Filter by client and inclusive From/To dates; print the matching report and
  individual invoices together.
- **Print/PDF:** orders, individual invoices, invoice reports, and individual or
  monthly labour sheets use the Pak Tribal logo and A4 layouts. Select **Print /
  Save PDF**, then **Save as PDF** in the browser to download a shareable file.

Money columns are `bigint` whole rupees. Invoice totals are generated from items
by PostgreSQL; all-time sums use SQL and are transported as text for exact bigint
calculations. Available Credit and labour balances are derived, never stored.

### Notifications and scheduled jobs

Both are optional — the CMS works fully without them, and the dashboard always
lists what is due regardless.

1. Generate push keys once: `npx web-push generate-vapid-keys`. Put the pair in
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.
2. Set `CRON_SECRET` to a long random string and `SUPABASE_SERVICE_ROLE_KEY` to
   the project's service-role key. **Server-side only** — the service-role key
   bypasses row-level security and is read by `src/lib/supabase/admin.ts` alone.
3. Deploy to Vercel. `vercel.json` schedules two jobs: due-date reminders daily
   at 09:00 PKT, and a data export every Sunday.
4. Open `/factory/settings` on the phone you want notified and turn notifications on.

**On iPhone, notifications only work once the site is added to the Home Screen**
(iOS 16.4+). In a plain Safari tab, `PushManager` does not exist. Android and
desktop Chrome work from a normal tab. `/factory/settings` detects this and shows
the Add to Home Screen instruction.

Test the reminder without waiting for the schedule:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/due-reminders
```

### Backups

Three layers, and only the first survives losing the Supabase project itself:

1. **Supabase point-in-time recovery** — a paid feature, off by default. Turn it
   on once real orders are in. This is a billing decision, not code.
2. **Download a copy of everything** in `/factory/settings` — one JSON file of every
   client, order (including items), invoice, balance, labour entry, expense and
   legacy payment. The version 2 export paginates all tables without a row cap.
3. **Weekly automated export** to the private `backups` bucket, last 12 kept.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm run check:cms
npm run verify:cms
npm run verify http://localhost:3000
```

The Playwright verifier writes screenshots and a report to `.verify/`.
`verify:cms` runs the real application against an isolated local Supabase protocol
fixture on port 3146 and writes its report, screenshots and sample PDFs to
`.verify-cms/`. It never uses the business database. `scripts/cms-database-check.sql`
checks PostgreSQL constraints, generated totals and RLS inside a rolled-back
transaction. It uses explicit numbers without consuming invoice/order sequences.

## Brand assets

The supplied Pak Tribal Furniture logo files remain in the project root. Optimized web versions live in `public/images/brand-horizontal.png` and `public/images/brand-mark.png`. The furniture photography in `public/images/furniture/` is placeholder imagery and should be replaced with the business's own product photography through Studio before launch.
