import type { MetadataRoute } from "next";

import { getPublishedProducts } from "@/lib/catalog";
import { site } from "@/content/site";

const routes = ["/", "/collections", "/custom", "/contact", "/privacy"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getPublishedProducts();
  const lastModified = new Date();
  return [
    ...routes.map((path, index) => ({ url: new URL(path, site.url).toString(), lastModified, changeFrequency: "monthly" as const, priority: index === 0 ? 1 : 0.8 })),
    ...products.map((product) => ({ url: new URL(`/collections/${product.slug}`, site.url).toString(), lastModified: new Date(product.updated_at), changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
