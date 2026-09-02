import { ProductCard } from "@/components/catalog/product-card";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import type { Product } from "@/types/database";

export function FeaturedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading eyebrow="Selected pieces" title="From the catalogue." description="Open a product to review its materials, dimensions, and enquiry details." />
          <ButtonLink href="/collections" variant="outline">View all pieces</ButtonLink>
        </Reveal>
        <div className="mt-12 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((product, index) => (
            <Reveal key={product.id} delay={(index % 3) * 0.06}><ProductCard product={product} /></Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
