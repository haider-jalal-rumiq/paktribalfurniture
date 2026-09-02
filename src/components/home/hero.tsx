import Image from "next/image";
import { ArrowDownRight, MessageCircle } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Parallax, Stagger, StaggerItem } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="overflow-hidden pb-12 pt-28 sm:pb-20 sm:pt-32">
      <Container>
        <div className="grid min-h-[calc(100svh-8rem)] items-center gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <Stagger className="relative z-10 py-8 lg:py-16">
            <StaggerItem>
              <p className="mb-6 text-xs font-bold uppercase tracking-[0.22em] text-accent">Pakistani woodcraft</p>
            </StaggerItem>
            <StaggerItem>
              <h1 className="max-w-3xl font-display text-[clamp(4rem,8vw,8.4rem)] leading-[0.78] tracking-[-0.055em] text-ink">
                Furniture with a sense of place.
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mt-8 max-w-xl text-lg leading-8 text-ink-soft">
                Solid wood furniture shaped by Pakistani craft and made for the way your home lives.
              </p>
            </StaggerItem>
            <StaggerItem className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/collections" size="lg">
                Explore collections
                <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/contact#enquiry" size="lg" variant="outline">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Send an enquiry
              </ButtonLink>
            </StaggerItem>
          </Stagger>

          <div className="relative min-h-[28rem] lg:min-h-[calc(100svh-10rem)]">
            <div className="absolute inset-0 overflow-hidden rounded-[0.35rem] bg-canvas-deep">
              <Parallax className="absolute -inset-y-12 inset-x-0" distance={36}>
                <Image
                  src="/images/furniture/hero-living-room.jpg"
                  alt="Green sofa in a warm, wood-accented interior"
                  fill
                  priority
                  sizes="(min-width: 1024px) 54vw, 100vw"
                  className="object-cover"
                />
              </Parallax>
            </div>
            <div className="absolute -bottom-5 -left-5 max-w-52 border border-hairline bg-surface p-5 shadow-lg sm:-left-8 sm:max-w-60">
              <p className="font-display text-2xl leading-tight text-ink">Choose the piece. Choose the wood.</p>
              <p className="mt-2 text-xs leading-5 text-muted">Ask about rosewood, cedar, pine, mango, or walnut.</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
