import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Small tile for a single number. `emphasis` promotes one tile to the hero of a
 * row — used for the outstanding balance, which is the figure the owner opens
 * the app to see.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  emphasis = false,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "accent";
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border p-4 shadow-[var(--shadow-card)] sm:p-5",
        emphasis
          ? "border-accent/25 bg-accent/8"
          : "border-hairline bg-surface",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {icon && <span className={cn(tone === "accent" ? "text-accent" : "text-muted")}>{icon}</span>}
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
      </div>
      <p
        className={cn(
          "mt-2 whitespace-nowrap font-display leading-none tabular-nums",
          emphasis ? "text-[2.1rem] sm:text-[2.6rem]" : "text-[1.75rem] sm:text-[2rem]",
          tone === "accent" ? "text-accent" : "text-ink",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-xs leading-5 text-muted">{hint}</p>}
    </div>
  );
}
