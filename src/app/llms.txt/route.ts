import { categories } from "@/content/catalog";
import { site } from "@/content/site";
import { getPublishedProducts } from "@/lib/catalog";
import { categoryUrl } from "@/lib/seo";

/**
 * A plain-text guide for AI assistants (https://llmstxt.org): what the business
 * is, what the site contains, and where to find each part. Built from the same
 * content the pages show, so it cannot drift from them.
 */
export const revalidate = 3600;

const absolute = (path: string): string => new URL(path, site.url).toString();

export async function GET(): Promise<Response> {
  const products = await getPublishedProducts();

  const productLines = products.length
    ? products.map((product) => `- [${product.name}](${absolute(`/collections/${product.slug}`)}): ${product.short_description}`)
    : ["- Pieces are listed here as they are published."];

  const body = [
    `# ${site.name}`,
    "",
    `> ${site.summary}`,
    "",
    `${site.name} makes solid-wood furniture in Islamabad, Pakistan. The website is a catalogue: visitors browse pieces by category, open a product for its details, and send an enquiry. The website does not take payments. The team completes orders directly, by WhatsApp.`,
    "",
    "## Collections",
    "",
    ...categories.map((category) => `- [${category.name}](${categoryUrl(category.slug)}): ${category.description}`),
    "",
    "## Products",
    "",
    ...productLines,
    "",
    "## Contact",
    "",
    `- WhatsApp sales: ${site.whatsapp.display} (${site.whatsapp.href})`,
    `- Instagram: ${site.instagramUrl}`,
    `- Google Maps listing: ${site.map.href}`,
    "",
    "## Optional",
    "",
    `- [Custom furniture enquiries](${absolute("/custom")}): share a reference, dimensions and wood choice.`,
    `- [Contact](${absolute("/contact")}): how to reach the team.`,
    `- [Privacy policy](${absolute("/privacy")})`,
    "",
  ].join("\n");

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
