import { CatalogGridSkeleton } from "@/components/catalog/catalog-skeleton";
import { Container } from "@/components/layout/container";
import { Shimmer } from "@/components/shared/shimmer";

/** Matches the collections page: the hero, the category filters, then the grid. */
export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading the collection</span>
      <section className="border-b border-hairline pb-16 pt-36 sm:pb-20 sm:pt-40">
        <Container>
          <Shimmer className="h-4 w-28 rounded-none" />
          <Shimmer className="mt-6 h-16 w-2/3 rounded-none sm:h-20" />
          <Shimmer className="mt-6 h-6 w-full max-w-2xl rounded-none" />
        </Container>
      </section>
      <section className="py-12 sm:py-16">
        <Container>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Shimmer key={index} className="h-11 w-28 rounded-none" />
            ))}
          </div>
          <div className="mt-12">
            <CatalogGridSkeleton />
          </div>
        </Container>
      </section>
    </div>
  );
}
