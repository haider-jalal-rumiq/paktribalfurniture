import { Shimmer } from "@/components/shared/shimmer";

/**
 * Placeholder product cards, sized like ProductCard so the grid keeps its
 * shape when the products arrive.
 */
export function CatalogGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <Shimmer className="aspect-[4/5] w-full rounded-none" />
          <div className="space-y-3 border-b border-hairline py-4">
            <Shimmer className="h-3 w-24 rounded-none" />
            <Shimmer className="h-7 w-3/4 rounded-none" />
            <Shimmer className="h-4 w-full rounded-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
