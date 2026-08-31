import type { MetadataRoute } from "next";

import { site } from "@/content/site";

const routes = [
  { path: "/", priority: 1 },
  { path: "/eyewear", priority: 0.9 },
  { path: "/native-visions", priority: 0.8 },
  { path: "/veterans", priority: 0.8 },
  { path: "/about", priority: 0.6 },
  { path: "/contact", priority: 0.9 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: new URL(route.path, site.url).toString(),
    lastModified,
    changeFrequency: "monthly",
    priority: route.priority,
  }));
}
