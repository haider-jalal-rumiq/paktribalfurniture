# Pak Tribal Furniture

An animated, responsive furniture catalogue built with Next.js 16, React 19, Tailwind CSS 4, Motion, and Supabase.

## What is included

- Eight furniture collections and five wood choices
- CMS-managed products with multiple photos, drafts, publishing, and featured placement
- Customer enquiries saved to Supabase before a prefilled WhatsApp handoff
- A protected Studio dashboard for products and recent enquiries
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
3. Copy the project URL and publishable key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Keep public email signups disabled in Supabase Auth.
5. Create the owner account in Authentication, then assign this account the admin role in its `app_metadata`:

```json
{ "role": "admin" }
```

Only `app_metadata` is trusted for authorization. Never put an admin role in user-editable metadata and never expose a secret or service-role key to the browser.

The private CMS is available at `/studio`. Public products appear only when their `published` switch is enabled.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm run verify
```

The Playwright verifier writes screenshots and a report to `.verify/`.

## Brand assets

The supplied Pak Tribal Furniture logo files remain in the project root. Optimized web versions live in `public/images/brand-horizontal.png` and `public/images/brand-mark.png`. The furniture photography in `public/images/furniture/` is placeholder imagery and should be replaced with the business's own product photography through Studio before launch.
