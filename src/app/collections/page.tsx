import type { Metadata } from "next";

import { CategoryCard } from "@/components/catalog/category-card";
import { CategoryFilters } from "@/components/catalog/category-filters";
import { ProductCard } from "@/components/catalog/product-card";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import { categories, getCategory } from "@/content/catalog";
import { getPublishedProducts } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Furniture collections",
  description: "Browse Pak Tribal Furniture beds, sofas, dining, storage, decor, and custom furniture collections.",
  path: "/collections",
});

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category: requestedCategory } = await searchParams;
  const activeCategory = requestedCategory ? getCategory(requestedCategory) : undefined;
  const products = await getPublishedProducts(activeCategory?.slug);

  return (
    <>
      <PageHero eyebrow="The catalogue" title={activeCategory?.name ?? "Furniture for every part of home."} description={activeCategory?.description ?? "Browse the full catalogue by category, then open a piece to send a detailed enquiry."} />
      <section className="py-12 sm:py-16">
        <Container>
          <CategoryFilters active={activeCategory?.slug} />
          {products.length > 0 ? (
            <div className="mt-12 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => <Reveal key={product.id} delay={(index % 3) * 0.05}><ProductCard product={product} /></Reveal>)}
            </div>
          ) : activeCategory ? (
            <Reveal className="mt-12 border border-hairline bg-surface p-8 sm:p-12">
              <h2 className="font-display text-4xl text-ink">This collection is being prepared.</h2>
              <p className="mt-4 max-w-xl leading-7 text-ink-soft">Published pieces will appear here as they are added in Studio. You can already send an enquiry about {activeCategory.name.toLowerCase()}.</p>
              <ButtonLink href={`/contact?category=${activeCategory.slug}#enquiry`} className="mt-7">Send an enquiry</ButtonLink>
            </Reveal>
          ) : (
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => <Reveal key={category.slug} delay={(index % 3) * 0.05}><CategoryCard category={category} className="h-[25rem]" priority={index < 3} /></Reveal>)}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
