import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PanelReveal, Parallax } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";

export function CraftAndCustom() {
  return (
    <section className="pb-20 sm:pb-28">
      <Container>
        <div className="grid overflow-hidden border border-hairline bg-surface lg:grid-cols-[1.15fr_0.85fr]">
          <PanelReveal direction="up" className="relative min-h-[26rem] overflow-hidden lg:min-h-[42rem]">
            <Parallax className="absolute -inset-y-10 inset-x-0" distance={30}>
              <Image src="/images/furniture/workshop.jpg" alt="Woodworker shaping a furniture component in a workshop" fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
            </Parallax>
          </PanelReveal>
          <PanelReveal direction="down" delay={0.08} className="flex flex-col justify-between p-7 sm:p-12 lg:p-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Made around your space</p>
              <h2 className="mt-5 font-display text-5xl leading-[0.92] tracking-[-0.035em] text-ink sm:text-6xl">Have a piece in mind?</h2>
              <p className="mt-6 max-w-md text-base leading-7 text-ink-soft">Share a reference, approximate dimensions, preferred wood, and the room it belongs in. The enquiry continues directly on WhatsApp.</p>
            </div>
            <ButtonLink href="/custom" size="lg" className="mt-10 w-full sm:w-auto sm:self-start">
              Start a custom enquiry
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </PanelReveal>
        </div>
      </Container>
    </section>
  );
}
