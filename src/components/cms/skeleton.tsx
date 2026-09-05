import { CmsPage } from "@/components/cms/cms-page";
import { cn } from "@/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[var(--radius-ui)] bg-wash", className)} />;
}

/**
 * Shown while a /cms route's data loads. Without it the tab bar highlights the
 * new section but the page stays on the old content, which reads as a freeze.
 */
export function CmsSkeleton({ title, rows = 5 }: { title: string; rows?: number }) {
  return (
    <CmsPage title={title}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-24 rounded-[var(--radius-card)]" />
        ))}
      </div>
      <Shimmer className="mt-9 h-7 w-40" />
      <div className="mt-3 space-y-px overflow-hidden rounded-[var(--radius-card)] border border-hairline">
        {Array.from({ length: rows }).map((_, i) => (
          <Shimmer key={i} className="h-[4.25rem] rounded-none" />
        ))}
      </div>
    </CmsPage>
  );
}
