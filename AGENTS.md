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

## Three apps, one codebase

| | Route | Who | What |
|---|---|---|---|
| **Site** | `/`, `/collections`, `/custom`, `/contact`, `/privacy` | public | catalogue + WhatsApp enquiry handoff |
| **Studio** | `/studio` | admin | the product catalogue |
| **CMS** | `/cms` | admin | clients, orders, invoices, balances, labour, expenses |

Both admin areas use the **same** Supabase email+password login and the same
claim: `app_metadata.role === "admin"`. `src/lib/supabase/proxy.ts` holds one
`PROTECTED_AREAS` list — add an area there and to the matcher in
`src/proxy.ts`, never a new branch.

**Next 16 renamed middleware.** The file is `src/proxy.ts` exporting `proxy()`.
There is no `middleware.ts`.

### Business facts

`src/content/site.ts` — name, WhatsApp number, Instagram.
`src/content/catalog.ts` — the eight categories.
`src/content/cms.ts` — client types, order statuses, legacy payment methods and
legacy expense category labels. New expense categories are free text.

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
    cms/         the order system (admin)
    studio/      the product catalogue (admin)
    api/cms/*    CMS writes, each guarded by getCmsSession()
    api/cron/*   scheduled jobs, guarded by CRON_SECRET — the ONLY
                 place allowed to import lib/supabase/admin.ts
  components/
    ui/          button, field — generic, hand-written, no shadcn CLI
    layout/      header, footer, container, chrome-gate, logo, nav
    cms/         cms-page, cms-nav, record-list, stat-card
    motion/      the shared animation primitives
  features/
    auth/        admin login + sign out, shared by /studio and /cms
    cms/         schemas + forms for client, order, invoice, balance, labour, expense
    inquiry/     public enquiry form (WhatsApp handoff, not booking)
    studio/      product editor
  content/       site.ts · catalog.ts · cms.ts — the sources of truth
  lib/
    cms-core.ts  pure logic: balances, PK dates, month ranges (no Supabase)
    cms.ts       "server-only" reads; re-exports cms-core
    money.ts     whole-rupee formatting and parsing
    supabase/    client · server · proxy · admin (service role, cron only)
```

**Rules that matter:**

- Server Components by default. `"use client"` only for interaction; keep the
  boundary small.
- Filter and pagination state belongs in `searchParams`.
- **Money is `bigint` whole rupees.** Never float, never `numeric`. Parse user
  input with `parseAmount()` — it rejects rather than coerces.
- **Balances are derived, never stored.** Credit is added balances minus expenses
  and paid labour. Invoices alone determine sales and do not increase Credit.
  Legacy `order_payments` stay in backups; active orders have no payments.
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
  CMS serves stale orders and cached auth pages.

---

## Commands

```bash
npm run dev        # dev server
npm run build      # production build (must pass)
npm run lint       # eslint (fix causes, do not suppress)
npm run typecheck  # tsc --noEmit
npm run check:cms  # assert-based self-check for money, balance, date logic
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
