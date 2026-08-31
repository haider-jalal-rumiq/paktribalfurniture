"use client";

import { openingHours } from "@/content/site";
import { getHoursStatus, summariseHours } from "@/features/hours/hours";
import { useZonedClock } from "@/features/hours/use-zoned-clock";
import { cn } from "@/lib/utils";

const DOT = {
  open: "bg-sage",
  "closing-soon": "bg-ember",
  closed: "bg-stone",
} as const;

/**
 * Live open/closed pill.
 *
 * Computed on the client and refreshed every minute — a statically rendered
 * status would be stale the moment the page was built. Before hydration it
 * shows the plain weekly summary, which is true at any hour and keeps the
 * layout from shifting.
 */
export function OpenStatus({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const clock = useZonedClock();
  const status = clock
    ? getHoursStatus(openingHours, clock.day, clock.minutes)
    : null;

  const dark = tone === "dark";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium",
        dark
          ? "border-white/20 bg-white/10 text-canvas"
          : "border-hairline bg-surface/80 text-ink-soft backdrop-blur-sm",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          status ? DOT[status.state] : "bg-stone",
        )}
      />
      {status ? status.label : summariseHours(openingHours)}
    </span>
  );
}
