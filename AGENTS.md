<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Pak Tribal Furniture

> Marketing catalogue **and** the business's own order system, for a solid-wood
> furniture maker in Islamabad, Pakistan.
> Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · Motion · Supabase

Everything here is meant to change a decision. If a line stops doing that,
delete it.

---

## Four apps, one codebase

| | Route | Who | What |
|---|---|---|---|
| **Site** | `/`, `/collections`, `/custom`, `/contact`, `/privacy` | public | catalogue + WhatsApp enquiry handoff |
| **Studio** | `/studio` | admin | the product catalogue |
| **Factory** | `/factory` | admin | the *factory*: clients, orders, invoices, inventory, balances, labour, expenses |
| **Shop** | `/shop` | admin | the *showroom*: counter sales, invoices, expenses, profit split |

All admin areas use the **same** Supabase email+password login and the same
claim: `app_metadata.role === "admin"`. `src/lib/supabase/proxy.ts` holds one
`PROTECTED_AREAS` list — add an area there and to the matcher in
`src/proxy.ts`, never a new branch.

**Next 16 renamed middleware.** The file is `src/proxy.ts` exporting `proxy()`.
There is no `middleware.ts`.

### Business facts

`src/content/site.ts` — name, WhatsApp number, Instagram.
`src/content/catalog.ts` — the eight categories.
`src/content/cms.ts` — client types, order statuses, legacy payment methods,
legacy expense category labels, the two printed trading names, and the
partner profit shares. New expense categories are free text.

**Two brands print from one component.** `/factory` invoices are headed WOODONA
HERITAGE (the factory), `/shop` invoices PAK TRIBAL FURNITURE (the showroom).
Both go through `InvoiceDocument` with a `brand` prop; never fork the document.

**Never hardcode a phone number or a category anywhere else.** The zod schemas,
the `<select>` options and the SQL CHECK constraints all derive from these three
files. Changing a CMS list means editing `src/content/cms.ts` *and* the matching
CHECK in `supabase/cms-schema.sql`.

---

## Working agreements

- **Verify, don't assume.** `npm run lint && npm run typecheck && npm run build`
  before claiming anything works, and report the real numbers.
- **No invented business facts.** If a claim about the business is not in
  `content/`, ask. Do not write plausible-sounding copy about services,
  warranties, brands, or pricing.
- **Graceful degradation is load-bearing.** Every Supabase call returns
  `null`/`[]` when the env vars are absent, so the public site builds and runs
  with no database. Any new reader must do the same.
- **Ask before scope grows.** E-commerce, online payment, and multi-user roles
  are out of scope.

---

## Design system

Tokens live in `src/app/globals.css` under `@theme`. **Use the token, never a
raw hex.** There is no `sage`, `clay`, or `ember` — those were a different
project.

```
--color-canvas      #ffffff   page background
--color-canvas-deep #f6f7f5   alternating band
--color-surface     #ffffff   cards
--color-ink         #14201c   body text
--color-ink-soft    #31423b   secondary text
--color-muted       #66746e   muted text
--color-accent      #963b36   CTA, links, anything urgent
--color-accent-deep #722b28   hover, error text
--color-hairline    #cbd2c8   borders
--color-wash        #eef1ec   hover fill
```

**Type**: Cormorant Garamond (display, `font-display`) + Manrope (body). Fluid
`clamp()` scale, `--text-xs` … `--text-5xl`. One `<h1>` per page.

**Light mode only**, as requested by the owner. White canvas/surface tokens and
`color-scheme: light`; no dark overrides or toggle.

**Motion**: everything routes through `src/components/motion/index.tsx` —
`Reveal`, `MaskReveal`, `Stagger`/`StaggerItem`, `TileReveal`, `PanelReveal`,
`ScrollRail`, `Parallax`. Do not hand-roll a one-off animation.
`prefers-reduced-motion` is a hard requirement: `useReducedMotionSafe()` gates
the JS variants and the CSS block in `globals.css` neutralises keyframes.

---

## Architecture

```
src/
  app/           routes only — no business logic
    factory/     the factory order system (admin)
    shop/        the showroom sales ledger (admin)
    studio/      the product catalogue (admin)
    api/factory/*    CMS writes, each guarded by getCmsSession()
    api/shop/*   shop writes, likewise guarded by getCmsSession()
    api/cron/*   scheduled jobs, guarded by CRON_SECRET — the ONLY
                 place allowed to import lib/supabase/admin.ts
  components/
    ui/          button, field — generic, hand-written, no shadcn CLI
    layout/      header, footer, container, chrome-gate, logo, nav
    cms/         cms-page, cms-nav, record-list, stat-card
    motion/      the shared animation primitives
  features/
    auth/        admin login + sign out, shared by /studio, /factory and /shop
    cms/         schemas + forms for client, order, invoice, balance, labour, wood, expense
    shop/        schemas + forms for a counter sale and a shop invoice
    inquiry/     public enquiry form (WhatsApp handoff, not booking)
    studio/      product editor
  content/       site.ts · catalog.ts · cms.ts — the sources of truth
  lib/
    cms-core.ts  pure logic: balances, PK dates, month ranges (no Supabase)
    cms.ts       "server-only" reads; re-exports cms-core
    inventory.ts stock photos and the invoice stock deduction
    orders.ts    derived order urgency
    accounting-core.ts  pure money logic: shop rows, invoice discount, payslips
    money.ts     whole-rupee formatting and parsing
    supabase/    client · server · proxy · admin (service role, cron only)
```

**Rules that matter:**

- Server Components by default. `"use client"` only for interaction; keep the
  boundary small.
- Filter and pagination state belongs in `searchParams`.
- **Money is `bigint` whole rupees.** Never float, never `numeric`. Parse user
  input with `parseAmount()` — it rejects rather than coerces.
- **Balances are derived, never stored.** Credit is added balances minus expenses,
  paid labour and wood payments. Invoices alone determine sales and do not increase Credit.
  Legacy `order_payments` stay in backups; active orders have no payments.
- **The two books are separate.** Shop net profit deducts `shop_expenses`
  only. The factory's `expenses`, `labour_entries` and `wood_entries` never touch it.
- **A shop sale row stores `sale_price` per unit, and that is the truth.**
  Saving a shop invoice drafts one row per line with the price from the
  invoice; `cost` stays null until the purchase price is entered, and a draft
  counts towards sales but *not* profit — otherwise an unpriced item would
  read as pure profit. A manual row has its price computed by
  `manualSalePrice()` before saving, with `margin_pct`/`discount_pct` kept
  beside it only as a record of how the price was reached. Margin shown in
  the ledger is always derived by `achievedMarginPct()`. A returned item keeps
  its row and leaves the totals.
- **Discounts are percentages, never rupees** — on the shop invoice
  (`discount_pct`, applied to the line subtotal by the generated column via
  `cms_shop_invoice_total()`) and on a manual sale row. `invoiceDiscount()`
  mirrors the SQL rounding.
- **A labour payslip is computed, not typed.** `labourTotals()` turns salary,
  per-day salary, leaves, OT hours, OT rate and deduction into total payable
  and balance. `lib/labour-write.ts` is the only writer of
  `labour_entries.total_amount`, and it uses that same function. Totals may go
  negative when deductions exceed earnings — that is shown, not clamped.
- **A wood supplier balance is computed, never stored.** Purchases increase the
  payable and separate actual-payment rows reduce it; never overwrite an earlier
  purchase to record a later payment. Only `wood_entries.paid_amount` reduces
  factory Credit and appears in expenses, using `paid_on` for the expense month.
- **Inventory belongs to the factory.** A factory invoice line carrying a
  `code` deducts that inventory item on **create only** — editing an invoice
  never re-adjusts stock, because a second pass would double-deduct the lines
  that did not change. Overselling is reported, not refused: stock floors at 0
  and the save returns a warning. Codes are matched case-insensitively, which
  the SQL unique index on `upper(btrim(code))` mirrors.
- **Urgency is derived, never stored alone.** `orders.urgent` is only the
  hand-ticked flag; `isUrgentOrder()` in `lib/orders.ts` ORs it with "open and
  within `URGENT_WITHIN_DAYS` of the delivery date". Read urgency through that
  function — never `order.urgent` directly — so it is right today without a
  scheduled job, and a delivered order does not turn red once its date passes.
- **"Today" means today in Pakistan.** Use `today()` from `lib/cms-core.ts`, not
  `new Date()` — the server runs in UTC and would roll the date at 5am PKT.
- Anything on a *public* page derived from "now" must be read on the client;
  public pages are static. CMS pages are `force-dynamic`, so server-side is fine
  there.
- Validation schemas are shared between client and server — one zod schema
  imported by both, so they cannot drift.
- Errors: log detail server-side with `{ code, message }`, return a friendly
  message. Never leak a stack, a schema name, or an internal path.

### Deliberate deviations, recorded so they read as decisions

- No `services/` or repository layer, no `store/`. Nothing needs either yet.
- Radix is used for exactly one thing: `react-dialog` in the mobile nav.
- Native `<select>` over a custom listbox — correct on mobile for free.
- The CMS uses plain `FormData` submits, not react-hook-form. The public
  enquiry form uses react-hook-form. Both validate with the same shared schema;
  don't unify them for its own sake.
- `record-list.tsx` renders stacked cards, not a table. The CMS is read on a
  phone; a horizontally scrolling table is unusable there.

---

## Security

- `app_metadata.role` is the **only** trusted authorization source. Never read a
  role from user-editable metadata.
- Every CMS table is admin-only under RLS. Nothing is readable by `anon`.
- `order-images` and `backups` are **private** buckets — order photos are
  customer documents. Pages render short-lived signed URLs.
  `product-images` stays public; it is the catalogue.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It is read by
  `src/lib/supabase/admin.ts` alone, imported only by `src/app/api/cron/*`, and
  never prefixed `NEXT_PUBLIC_`. `grep -r SERVICE_ROLE src/` must match one file.
- `public/sw.js` has **no fetch handler** on purpose. Caching an authenticated
  admin app serves stale orders and cached auth pages.

---

## Commands

```bash
npm run dev        # dev server
npm run build      # production build (must pass)
npm run lint       # eslint (fix causes, do not suppress)
npm run typecheck  # tsc --noEmit
npm run check:cms  # assert-based self-check for money, balance, date, shop logic
npm run verify     # Playwright: screenshots, a11y, form, SEO, reduced motion
```

`npm run verify` writes PNGs and `report.txt` to `.verify/`, and defaults to
port **3140** — `.claude/launch.json` runs the dev server on 3000, so pass the
URL: `npm run verify http://localhost:3000`. **Look at the screenshots** — a
passing assertion count does not mean the page looks right.

---

## Placeholders to replace before launch

- `public/images/furniture/*.jpg` — placeholder photography.
- `public/images/hero-shop.png` — 3.8 MB and unreferenced; delete it.
- `site.url` — set `NEXT_PUBLIC_SITE_URL` for production.
- Supabase point-in-time recovery is a paid feature and is **off**. The weekly
  export protects against bad edits, not against losing the project.
