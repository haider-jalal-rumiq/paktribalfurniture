import type { MetadataRoute } from "next";

import { site } from "@/content/site";

/**
 * Every public page is open to all crawlers, including the AI search and
 * answer bots. The admin areas are closed here and also carry a noindex tag.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/factory/", "/shop/", "/studio/"] },
    sitemap: new URL("/sitemap.xml", site.url).toString(),
  };
}
