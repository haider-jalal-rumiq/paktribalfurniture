# SEO, AEO and GEO

How the site is found by search engines (SEO), answer engines such as Google's AI
Overviews and Bing Copilot (AEO), and generative assistants such as ChatGPT,
Claude and Perplexity (GEO). Everything here is generated from the same content
the pages show, so the search copy cannot drift from the site.

## What is in place

| Part | Where | What it does |
| --- | --- | --- |
| Business facts | `src/content/site.ts` | `summary` is the one-sentence description used by snippets, schema and `llms.txt`. |
| Metadata helper | `src/lib/seo.tsx` | Title, canonical, Open Graph and Twitter tags for every public page. |
| Organisation | `src/lib/seo.tsx`, `src/app/layout.tsx` | A `FurnitureStore` entity with the Islamabad base, the E.164 WhatsApp number, the Instagram and Maps listings. |
| WebSite | `src/lib/seo.tsx`, `src/app/layout.tsx` | Names the site and links it to the organisation. |
| Product | `src/app/collections/[slug]/page.tsx` | Name, description, absolute image URLs, category, wood names, dimensions, and a link to the organisation. |
| Collection list | `src/app/collections/page.tsx` | An `ItemList` of the products on the page. |
| Category pages | `src/app/collections/page.tsx` | Each category has its own title, description, image and canonical URL. |
| Breadcrumbs | `src/app/collections/[slug]/page.tsx` | Home, Collections, product. |
| Sitemap | `src/app/sitemap.ts` | Pages, the eight category pages, and every published product with its photos. |
| Robots | `src/app/robots.ts` | Every public page is open. `/api/`, `/factory/`, `/shop/` and `/studio/` are closed. |
| llms.txt | `src/app/llms.txt/route.ts` | A plain-text guide for AI assistants: what the business is, the collections, the products, the contact details, and where to find each part. |
| Social preview | `public/images/social/og-default.jpg` | A 1200 × 630 branded card, used when a page has no photo of its own. |
| Admin areas | `src/app/factory/layout.tsx`, `src/app/shop/layout.tsx`, `src/app/studio/layout.tsx` | `noindex, nofollow`, in addition to the robots rules. |
| JSON-LD safety | `src/lib/seo.tsx` | `<` is escaped inside structured data, so product text cannot close the script tag. |

## Before launch (needs you)

1. **Set `NEXT_PUBLIC_SITE_URL` in Vercel to the live address.** Without it, the
   canonical tags, sitemap, robots sitemap line, social previews and structured data
   all point at `http://localhost:3000`. This is the most important item.
2. **Google Search Console.** Add the property, verify it, and submit
   `https://<your-domain>/sitemap.xml`. Use the same steps in Bing Webmaster Tools.
3. **Google Business Profile.** Keep the name, Islamabad location and WhatsApp
   number the same as the site. The site links to the Maps listing.
4. **About and FAQ content.** AI answers rely on clear statements about the
   business. The site has no About page yet. Only the owner can state the history,
   the workshop, the lead times, delivery areas and payment methods. Once written,
   FAQs can get `FAQPage` markup.
5. **Product copy in Studio.** The short description is used in search snippets and
   in `llms.txt`. A longer description, the wood, and the dimensions help answer
   engines describe each piece accurately.
6. **Photography and alt text.** Replace the placeholder photos in
   `public/images/furniture/`. Product photos use the product name as alt text.
7. **Unused photo.** `public/images/hero-shop.png` (3.8 MB) is not referenced. The
   project rules say to delete it, and that needs your approval.

## Decisions for you

- **AI crawler policy.** Every public page is open to all crawlers, including the
  AI answer bots and the training bots (GPTBot, ClaudeBot, Google-Extended and
  others). Visibility in AI answers needs the answer bots. To opt out of training
  only, add rules for those agents to `src/app/robots.ts`.
- **Organisation type.** The site uses `FurnitureStore`, because there is a showroom
  listing on Google Maps. Change it to `Organization` if the business is only a
  maker with no showroom.
- **Street address.** The repository has only the city. Add the street address to
  `organizationSchema()` once you confirm it, since a full address makes the
  listing eligible for local results.

## Checking it

```bash
npm run build
npm start
npm run verify http://localhost:3000
```

`npm run verify` writes `.verify/report.txt`. It covers the metadata, the robots
rules, the sitemap, `llms.txt`, the 404 status and the structured-data types on
every route, along with the layout checks.

It cannot check a product page on its own, because that page needs a published
product in the database. Check one by opening it and looking at the `Product`
block in the page source, or with Google's Rich Results Test.
