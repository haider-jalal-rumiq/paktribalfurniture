# Pak Tribal Furniture

An animated, responsive furniture catalogue built with Next.js 16, React 19, Tailwind CSS 4, Motion, and Supabase.

## What is included

- Eight furniture collections and five wood choices
- CMS-managed products with multiple photos, drafts, publishing, and featured placement
- Customer enquiries saved to Supabase before a prefilled WhatsApp handoff
- A protected Studio dashboard for products and recent enquiries
- A protected business CMS at `/cms` for clients, orders, payments and workshop
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
3. Copy the project URL and publishable key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Keep public email signups disabled in Supabase Auth.
5. Create the owner account in Authentication, then assign this account the admin role in its `app_metadata`:

```json
{ "role": "admin" }
```

Only `app_metadata` is trusted for authorization. Never put an admin role in user-editable metadata and never expose a secret or service-role key to the browser.

The product catalogue tool is at `/studio`; public products appear only when their `published` switch is enabled. The business CMS is at `/cms`.

## Business CMS (`/cms`)

Clients, orders, payments received and workshop expenses. Same login as Studio.
Money is stored as whole rupees; an order's balance is derived from its payment
rows, never stored.

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
4. Open `/cms/settings` on the phone you want notified and turn notifications on.

**On iPhone, notifications only work once the site is added to the Home Screen**
(iOS 16.4+). In a plain Safari tab, `PushManager` does not exist. Android and
desktop Chrome work from a normal tab. `/cms/settings` detects this and shows
the Add to Home Screen instruction.

Test the reminder without waiting for the schedule:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/due-reminders
```

### Backups

Three layers, and only the first survives losing the Supabase project itself:

1. **Supabase point-in-time recovery** — a paid feature, off by default. Turn it
   on once real orders are in. This is a billing decision, not code.
2. **Download a copy of everything** in `/cms/settings` — one JSON file of every
   client, order, payment and expense.
3. **Weekly automated export** to the private `backups` bucket, last 12 kept.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm run check:cms
npm run verify http://localhost:3000
```

The Playwright verifier writes screenshots and a report to `.verify/`.

## Brand assets

The supplied Pak Tribal Furniture logo files remain in the project root. Optimized web versions live in `public/images/brand-horizontal.png` and `public/images/brand-mark.png`. The furniture photography in `public/images/furniture/` is placeholder imagery and should be replaced with the business's own product photography through Studio before launch.
