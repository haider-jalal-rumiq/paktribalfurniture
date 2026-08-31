import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { Stagger, StaggerItem } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import { FrameCard } from "@/features/eyewear/frame-card";
import { featuredFrames } from "@/features/eyewear/frames";

export function FeaturedFrames() {
  return (
    // `contain: paint` — the bleed carousel's scrollable overflow otherwise
    // propagates to the viewport and lets the whole page pan sideways into blank
    // space on mobile. overflow-x: clip/hidden here does not stop it; this does.
    <section className="bg-canvas-deep py-24 [contain:paint] sm:py-32">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="The wall"
            title="Frames worth trying on"
            lede="Hundreds in the shop, from featherweight titanium to hand-finished acetate. Here are a few we keep reaching for."
          />
          <ButtonLink href="/eyewear" variant="outline" className="shrink-0">
            See all frames
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>

        {/* Snap-scrolls on small screens, becomes a grid from md up. */}
        <Stagger
          className="mt-12 -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3"
          gap={0.07}
        >
          {featuredFrames.map((frame) => (
            <StaggerItem
              key={frame.id}
              className="w-[78vw] shrink-0 snap-start sm:w-[60vw] md:w-auto"
            >
              <FrameCard frame={frame} className="h-full" />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
