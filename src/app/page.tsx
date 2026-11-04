import { Suspense } from "react";

import { CatalogGridSkeleton } from "@/components/catalog/catalog-skeleton";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { CraftAndCustom } from "@/components/home/craft-and-custom";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { Materials } from "@/components/home/materials";
import { Container } from "@/components/layout/container";
import { getPublishedProducts } from "@/lib/catalog";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryShowcase />
      <Materials />
      {/* The product query is the slow part of the home page, so the rest of it streams first. */}
      <Suspense fallback={<FeaturedProductsFallback />}>
        <FeaturedProductsSection />
      </Suspense>
      <CraftAndCustom />
    </>
  );
}

async function FeaturedProductsSection() {
  const products = await getPublishedProducts();
  return <FeaturedProducts products={products} />;
}

function FeaturedProductsFallback() {
  return (
    <section role="status" aria-live="polite" className="py-2 sm:py-8">
      <span className="sr-only">Loading featured pieces</span>
      <Container>
        <div className="mt-12">
          <CatalogGridSkeleton />
        </div>
      </Container>
    </section>
  );
}
