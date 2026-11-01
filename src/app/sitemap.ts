import type { MetadataRoute } from "next";

import { categories } from "@/content/catalog";
import { site } from "@/content/site";
import { getPublishedProducts } from "@/lib/catalog";
import { categoryUrl } from "@/lib/seo";

const routes = ["/", "/collections", "/custom", "/contact", "/privacy"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getPublishedProducts();
  const lastModified = new Date();
  return [
    ...routes.map((path, index) => ({ url: new URL(path, site.url).toString(), lastModified, changeFrequency: "monthly" as const, priority: index === 0 ? 1 : 0.8 })),
    ...categories.map((category) => ({ url: categoryUrl(category.slug), lastModified, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...products.map((product) => ({
      url: new URL(`/collections/${product.slug}`, site.url).toString(),
      lastModified: new Date(product.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: product.image_urls.map((image) => new URL(image, site.url).toString()),
    })),
  ];
}
