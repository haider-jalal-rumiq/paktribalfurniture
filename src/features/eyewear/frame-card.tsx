"use client";

import Image from "next/image";
import { motion } from "motion/react";

import { useReducedMotionSafe } from "@/components/motion";
import { FrameSilhouette } from "@/features/eyewear/frame-silhouette";
import type { Frame } from "@/features/eyewear/frames";
import { cn } from "@/lib/utils";

interface FrameCardProps {
  frame: Frame;
  className?: string;
  /** Above-the-fold cards skip lazy loading. */
  priority?: boolean;
}

export function FrameCard({ frame, className, priority }: FrameCardProps) {
  const reduce = useReducedMotionSafe();

  return (
    <motion.article
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface",
        className,
      )}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-canvas-deep">
        {frame.image ? (
          <Image
            src={frame.image}
            alt={`${frame.name} ${frame.shape.toLowerCase()} frames in ${frame.colors[0].toLowerCase()}`}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            priority={priority}
            className={cn(
              "object-cover transition-transform duration-700 ease-[var(--ease-out-soft)]",
              !reduce && "group-hover:scale-[1.06]",
            )}
          />
        ) : (
          <FrameSilhouette
            frame={frame}
            className={cn(
              "transition-transform duration-700 ease-[var(--ease-out-soft)]",
              !reduce && "group-hover:scale-[1.04]",
            )}
          />
        )}

        {frame.category === "Native Visions" && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-canvas backdrop-blur-sm">
            Exclusive
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl text-ink">{frame.name}</h3>
          <span className="shrink-0 text-xs font-medium uppercase tracking-[0.12em] text-stone">
            {frame.shape}
          </span>
        </div>

        <p className="flex-1 text-sm leading-relaxed text-ink-soft">
          {frame.blurb}
        </p>

        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone">
          <div className="flex gap-1.5">
            <dt className="sr-only">Material</dt>
            <dd>{frame.material}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="sr-only">Colours</dt>
            <dd>{frame.colors.join(" · ")}</dd>
          </div>
        </dl>
      </div>
    </motion.article>
  );
}
