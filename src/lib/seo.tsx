import type { Metadata } from "next";

import { openingHours, site } from "@/content/site";

const DAY_SCHEMA = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

interface PageMetaOptions {
  title: string;
  description: string;
  /** Route path, e.g. "/eyewear". Use "/" for the home page. */
  path: string;
}

/**
 * Per-page metadata with a canonical URL. Titles are composed by the template
 * in the root layout, so pass the bare page title here.
 */
export function pageMetadata({
  title,
  description,
  path,
}: PageMetaOptions): Metadata {
  const url = new URL(path, site.url).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: `${title} — ${site.name}`,
      description,
      url,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${site.name}`,
      description,
    },
  };
}

function toIsoTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  return `${hour.toString().padStart(2, "0")}:${(minutes % 60)
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Optician / LocalBusiness structured data.
 *
 * This is the single biggest SEO gap on the current site — without it Google
 * has no machine-readable hours, location or service area for the shop.
 */
export function localBusinessSchema(): Record<string, unknown> {
  const open = openingHours.filter(
    (entry): entry is typeof entry & { opens: number; closes: number } =>
      entry.opens !== null && entry.closes !== null,
  );

  return {
    "@context": "https://schema.org",
    "@type": "Optician",
    "@id": `${site.url}/#business`,
    name: site.name,
    legalName: site.legalName,
    description: site.description,
    url: site.url,
    telephone: site.phone,
    email: site.email,
    priceRange: "$$",
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card, AHCCCS, American Indian Health Plan",
    address: {
      "@type": "PostalAddress",
      streetAddress: `${site.address.street}, ${site.address.suite}`,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.zip,
      addressCountry: site.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.latitude,
      longitude: site.geo.longitude,
    },
    hasMap: site.mapsUrl,
    areaServed: {
      "@type": "City",
      name: "Phoenix",
      containedInPlace: { "@type": "State", name: "Arizona" },
    },
    openingHoursSpecification: open.map((entry) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${DAY_SCHEMA[entry.day]}`,
      opens: toIsoTime(entry.opens),
      closes: toIsoTime(entry.closes),
    })),
    knowsAbout: [
      "Prescription eyeglasses",
      "Prescription sunglasses",
      "Eyeglass repair",
      "Contact lens prescriptions",
      "Veteran vision benefits",
    ],
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

/** Renders JSON-LD. Server-only: the object never reaches the client bundle. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
