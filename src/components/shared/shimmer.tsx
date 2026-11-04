import { cn } from "@/lib/utils";

/** A pulsing placeholder block for loading states. Reduced motion shortens the pulse via globals.css. */
export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[var(--radius-ui)] bg-wash", className)} />;
}
