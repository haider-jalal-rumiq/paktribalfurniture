import type { Metadata } from "next";

import { site } from "@/content/site";
import type { Product } from "@/types/database";

interface PageMetaOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
}

export function pageMetadata({
  title,
  description,
  path,
  image = "/images/furniture/hero-living-room.jpg",
}: PageMetaOptions): Metadata {
  const url = new URL(path, site.url).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: `${title} | ${site.name}`,
      description,
      url,
      locale: "en_PK",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description,
      images: [image],
    },
  };
}

export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    description: site.description,
    logo: new URL("/images/brand-mark.png", site.url).toString(),
    sameAs: [site.instagramUrl],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: site.whatsapp.display,
      availableLanguage: ["English", "Urdu"],
    },
  };
}

export function productSchema(product: Product): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description,
    image: product.image_urls.map((image) => new URL(image, site.url).toString()),
    url: new URL(`/collections/${product.slug}`, site.url).toString(),
    material: product.wood_types,
    brand: {
      "@type": "Brand",
      name: site.name,
    },
  };
}

export function breadcrumbSchema(
  crumbs: readonly { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: new URL(crumb.path, site.url).toString(),
    })),
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
