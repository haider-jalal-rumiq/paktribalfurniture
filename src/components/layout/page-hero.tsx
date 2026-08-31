import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { Stagger, StaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  lede?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Shared masthead for every page except the home page. */
export function PageHero({
  eyebrow,
  title,
  lede,
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "border-b border-hairline bg-canvas-deep pb-16 pt-36 sm:pb-20 sm:pt-44",
        className,
      )}
    >
      <Container>
        <Stagger className="flex max-w-3xl flex-col gap-5" gap={0.07}>
          <StaggerItem y={10}>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
              {eyebrow}
            </span>
          </StaggerItem>

          <span className="block overflow-hidden pb-1">
            <StaggerItem y="100%">
              <h1 className="font-display text-4xl text-ink sm:text-5xl">
                {title}
              </h1>
            </StaggerItem>
          </span>

          {lede && (
            <StaggerItem>
              <p className="text-lg leading-relaxed text-ink-soft">{lede}</p>
            </StaggerItem>
          )}

          {children && <StaggerItem>{children}</StaggerItem>}
        </Stagger>
      </Container>
    </section>
  );
}
