import type { Metadata } from "next";

import { categories, getCategory } from "@/content/catalog";
import { site, woodTypes } from "@/content/site";
import type { Product } from "@/types/database";

/** Shown when a page has no photo of its own. 1200 x 630 is the size social previews expect. */
export const DEFAULT_SOCIAL_IMAGE = "/images/social/og-default.jpg";

const organizationId = `${site.url}/#organization`;

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
  image = DEFAULT_SOCIAL_IMAGE,
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

/**
 * The business as a local furniture store. Only facts the site already states
 * are here: the Islamabad base, the WhatsApp line, the Instagram and Maps listings.
 * The street address is not in the repository, so it is left out.
 */
export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "@id": organizationId,
    name: site.name,
    url: site.url,
    description: site.summary,
    logo: new URL("/images/brand-mark.png", site.url).toString(),
    image: new URL(DEFAULT_SOCIAL_IMAGE, site.url).toString(),
    telephone: `+${site.whatsapp.international}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Islamabad",
      addressCountry: "PK",
    },
    hasMap: site.map.href,
    sameAs: [site.instagramUrl, site.map.href],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: `+${site.whatsapp.international}`,
      availableLanguage: ["English"],
    },
  };
}

export function websiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: site.url,
    name: site.name,
    description: site.description,
    inLanguage: "en",
    publisher: { "@id": organizationId },
  };
}

function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

export function productSchema(product: Product): Record<string, unknown> {
  const category = getCategory(product.category_slug);
  const materials = woodTypes.filter((wood) => product.wood_types.includes(wood.slug)).map((wood) => wood.name);
  const images = product.image_urls.map(absoluteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description,
    url: absoluteUrl(`/collections/${product.slug}`),
    image: images.length ? images : undefined,
    category: category?.name,
    material: materials.length ? materials : undefined,
    additionalProperty: product.dimensions
      ? [{ "@type": "PropertyValue", name: "Dimensions", value: product.dimensions }]
      : undefined,
    brand: {
      "@type": "Brand",
      name: site.name,
    },
    manufacturer: { "@id": organizationId },
  };
}

/** The products on a collection page, in the order the page shows them. */
export function productListSchema(products: readonly Product[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.name,
      url: absoluteUrl(`/collections/${product.slug}`),
    })),
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
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function categoryUrl(slug: (typeof categories)[number]["slug"]): string {
  return absoluteUrl(`/collections?category=${slug}`);
}

/**
 * Escapes "<" so product text can never close the script tag early. The JSON
 * stays valid: "<" is the same character inside a JSON string.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
