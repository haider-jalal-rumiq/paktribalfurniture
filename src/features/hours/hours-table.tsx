"use client";

import { openingHours } from "@/content/site";
import { useZonedClock } from "@/features/hours/use-zoned-clock";
import { cn, formatMinutes } from "@/lib/utils";

/**
 * Today's row is highlighted on the client only. Pages are statically rendered,
 * so a server-computed "today" would be frozen at build time.
 */
export function HoursTable({ tone = "light" }: { tone?: "light" | "dark" }) {
  const today = useZonedClock()?.day ?? null;
  const dark = tone === "dark";

  return (
    <dl className="flex flex-col">
      {openingHours.map((entry) => {
        const isToday = today === entry.day;
        return (
          <div
            key={entry.day}
            className={cn(
              "flex items-baseline justify-between gap-4 border-b py-2.5 text-sm last:border-b-0",
              dark ? "border-white/10" : "border-hairline",
              isToday && (dark ? "text-ember" : "text-clay"),
              !isToday && (dark ? "text-canvas/70" : "text-ink-soft"),
            )}
          >
            <dt className={cn(isToday && "font-semibold")}>
              {entry.label}
              {isToday && <span className="sr-only"> (today)</span>}
            </dt>
            <dd className={cn("tabular-nums", isToday && "font-semibold")}>
              {entry.opens != null && entry.closes != null
                ? `${formatMinutes(entry.opens)} – ${formatMinutes(entry.closes)}`
                : "Closed"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
