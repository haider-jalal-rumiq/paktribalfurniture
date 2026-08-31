<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sundance Optical

> Marketing site for a real optician in Phoenix, Arizona.
> Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · Motion

This replaced a ~96 KB spec written for an unrelated project. It is deliberately
short: every kilobyte here is re-read on every request, so it holds only what
changes a decision.

---

## What this is

A rebuild of `sundanceoptical.com`, currently a fixed-width WordPress site with
no mobile layout, no hours, no map, no imagery, and no way to make contact
except a phone number in the footer.

The rebuild exists to **convert**. Its three real differentiators — all buried
as plain text on the old site — lead here instead:

1. Veteran owned — Philip K. Clark, retired Navy Chief Petty Officer.
2. A Phoenix family in eye care since 1951.
3. Native Visions Eyewear — frames by Native American artists, exclusive locally.

**Status: pitch build.** Frontend only, no database. It is shown to the owner to
win the work. Do not add backend infrastructure without being asked.

### Business facts

Everything lives in `src/content/site.ts`. **Never hardcode a phone number,
address, or opening hour anywhere else** — that file is the single source, and
the JSON-LD is generated from it.

| | |
|---|---|
| Address | 4201 N 16th St, Suite 160, Phoenix, AZ 85016 |
| Phone / email | (602) 277-5007 · sundanceoptical@gmail.com |
| Hours | Mon–Fri 8:00 AM – 5:00 PM (Arizona; no DST) |
| Coverage | Any doctor's Rx · AHCCCS/AIHP for Native patients under 21 · veteran discounts |
| Landmarks | Opposite Phoenix Indian Medical Center; ~1 mi from the Carl T. Hayden VA |

---

## Working agreements

- **Verify, don't assume.** Run `npm run verify` before claiming anything works,
  and report the real numbers.
- **No invented business facts.** If a claim about the shop is not in `site.ts`
  or on the current site, ask. Do not write plausible-sounding copy about
  services, warranties, brands, or pricing.
- **No fabricated reviews or people.** `reviews` holds real, attributed quotes
  only. Never generate a synthetic portrait of Philip Clark — a real, named
  person. The About page uses a credential card until a real photo exists.
- **Ask before scope grows.** Backend, CMS, e-commerce, and online booking are
  explicitly out of scope for the pitch.

---

## Design system

Tokens live in `src/app/globals.css` under `@theme`. **Use the token, never a
raw hex.**

```
--color-ink         #1A1512   body text, dark bands
--color-ink-soft    #3B322C   secondary text
--color-canvas      #FAF6F0   page background
--color-canvas-deep #F1E9DD   alternating section background
--color-surface     #FFFFFF   cards
--color-clay        #B4552D   primary CTA, links, brand
--color-clay-deep   #8F4123   hover, error text
--color-ember       #E08C3E   accents, focus ring, dark-band highlight
--color-sage        #4A5D4E   trust / veteran cues
--color-stone       #8C8073   muted text — large text and borders ONLY (3.4:1)
--color-hairline    #E2D7C8   borders
```

Body copy is `ink` or `ink-soft` on `canvas`. `stone` never carries body text.

**Type**: Fraunces (display, `font-display`) + Inter (body). Fluid `clamp()`
scale, `--text-xs` … `--text-5xl`. One `<h1>` per page, no skipped levels.

**Motion**: everything routes through `src/components/motion/` — `Reveal`,
`Stagger`/`StaggerItem`, `Parallax`, `CountUp`, `DrawLine`. Do not hand-roll a
one-off animation; reuse or extend that module. Standard easing is
`--ease-out-soft`; reveals are `once: true`.

`prefers-reduced-motion` is a hard requirement. `useReducedMotionSafe()` gates
the JS variants; the CSS block in `globals.css` neutralises keyframes. Any new
animation must be inert under reduced motion, and the reduced-motion checks in
`scripts/verify.mjs` must still pass.

---

## Architecture

```
src/
  app/           routes only — no business logic
  components/
    ui/          button, field, badge — generic, no business logic
    layout/      header, mobile-nav, footer, container, page-hero, logo
    motion/      the shared animation primitives
    home/        home page sections (each used once)
  features/
    eyewear/     frames data, card, silhouette placeholder, filters
    appointment/ zod schema + form
    hours/       open/closed logic, table, live status pill
  content/site.ts   business facts — the single source of truth
  lib/           utils (cn, formatMinutes), seo (metadata + JSON-LD)
```

**Deliberate deviations, recorded so they read as decisions rather than drift:**

- No `services/` or repository layer. There is no database; a service wrapping a
  static array would be an abstraction with one implementation. When a backend
  lands it slots into `features/*`.
- No `store/`. Nothing needs global client state.
- No shadcn CLI. The primitives in `components/ui/` are hand-written; the only
  Radix dependency is `react-dialog`, used for the mobile menu because focus
  trapping and scroll locking are worth not reimplementing.
- Native `<select>` over a custom listbox — accessible and correct on mobile for
  free.

**Rules that do matter here:**

- Server Components by default. `"use client"` only for interaction, and keep
  the boundary small — `FrameFilters` is client, the grid around it is not.
- Filter and pagination state belongs in `searchParams`, so a filtered view is
  shareable and indexable.
- Anything derived from "now" must be read on the client via `useZonedClock()`.
  Pages are static; a server-computed "today" freezes at build time.

---

## Conventions

- TypeScript strict. No `any`. Explicit return types on exported functions.
- Components PascalCase, files kebab-case, hooks `use*`.
- Comments explain **why**, never what. Delete a comment that restates the code.
- Every form field: real `<label>`, `aria-invalid`, `aria-describedby` wired to
  its error, and focus moves to the first invalid field on submit.
- Validation schemas are shared between client and server — one Zod schema
  imported by both, so they cannot drift.
- Errors: log detail server-side, return a friendly message with the phone
  number. Never leak a stack, a schema name, or an internal path.

---

## Commands

```bash
npm run dev        # dev server
npm run build      # production build (must pass)
npm run lint       # eslint (must pass — fix causes, do not suppress)
npm run typecheck  # tsc --noEmit
npm run verify     # Playwright: screenshots, a11y, form, filters, SEO, reduced motion
npm run check:hours
```

`npm run verify` writes PNGs and `report.txt` to `.verify/`. **Look at the
screenshots** — a passing assertion count does not mean the page looks right.

### Local environment note

This project is developed at `C:\dev\sundance-optical` and mirrored to
`G:\My Drive\sundance-optical`. Google Drive is not an NTFS volume, so
`node_modules` cannot be junctioned there and npm installs against it take 30+
minutes. Work on the local copy; sync source only — never `node_modules` or
`.next`.

---

## Placeholders to replace before launch

Search for `placeholder:` and `TODO`.

- `public/images/*.png` — four AI-generated scene images standing in for real
  shop photography.
- Frame catalogue in `features/eyewear/frames.ts` — invented names and
  descriptions. Each card draws a shape silhouette because no frame has a photo;
  set `image` on a frame and the card uses it automatically.
- About page credential card — awaiting a real headshot.
- `site.url`, and `geo` coordinates (approximate; refine from the Google
  Business Profile).
- `api/appointments/route.ts` logs instead of emailing. Resend drops in at the
  marked TODO. Its in-memory rate limit is per-instance — move to a shared store
  if the site ever runs multiple instances.
