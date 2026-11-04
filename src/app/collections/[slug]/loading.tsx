import { Container } from "@/components/layout/container";
import { Shimmer } from "@/components/shared/shimmer";

/** Matches a product page: the photo gallery beside the product copy. */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="pb-20 pt-28 sm:pb-28 sm:pt-32">
      <span className="sr-only">Loading the product</span>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <Shimmer className="aspect-[5/4] w-full rounded-none" />
          <div className="space-y-5 lg:pt-8">
            <Shimmer className="h-3 w-28 rounded-none" />
            <Shimmer className="h-14 w-4/5 rounded-none" />
            <Shimmer className="h-6 w-full rounded-none" />
            <Shimmer className="h-6 w-5/6 rounded-none" />
            <Shimmer className="mt-8 h-12 w-56 rounded-none" />
          </div>
        </div>
      </Container>
    </div>
  );
}
