import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "warn" | "info" | "good" | "accent";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-hairline bg-wash/60 text-ink-soft",
  warn: "border-status-warn/25 bg-status-warn/12 text-status-warn",
  info: "border-status-info/25 bg-status-info/12 text-status-info",
  good: "border-status-good/25 bg-status-good/12 text-status-good",
  accent: "border-accent/25 bg-accent/10 text-accent",
};

/** One source of truth for what each order status looks like. */
export const STATUS_TONE: Record<string, BadgeTone> = {
  pending: "warn",
  in_progress: "info",
  ready: "good",
  delivered: "neutral",
  cancelled: "neutral",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] border px-2.5 py-1 text-xs font-semibold leading-none",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A small filled dot, for status shown without a full pill. */
export function Dot({ tone = "neutral" }: { tone?: BadgeTone }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
        tone === "warn" && "bg-status-warn",
        tone === "info" && "bg-status-info",
        tone === "good" && "bg-status-good",
        tone === "accent" && "bg-accent",
        tone === "neutral" && "bg-muted",
      )}
    />
  );
}
