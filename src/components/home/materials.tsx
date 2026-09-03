import { Container } from "@/components/layout/container";
import { MaskReveal, ScrollRail } from "@/components/motion";
import { woodTypes } from "@/content/site";

export function Materials() {
  return (
    <section id="materials" className="relative scroll-mt-24 overflow-hidden border-y border-hairline bg-canvas-deep py-20 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden opacity-[0.055]">
        <ScrollRail>
          <span className="font-display text-[clamp(7rem,18vw,17rem)] leading-none tracking-[-0.055em] text-ink">
            ROSEWOOD · CEDAR · PINE · MANGO · WALNUT ·
          </span>
        </ScrollRail>
      </div>
      <Container className="relative z-10">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <MaskReveal>
            <p className="font-display text-4xl leading-[1.02] text-ink sm:text-5xl">The material changes how a piece feels, ages, and holds a room.</p>
          </MaskReveal>
          <div className="divide-y divide-hairline border-y border-hairline">
            {woodTypes.map((wood, index) => (
              <MaskReveal key={wood.slug} delay={index * 0.055}>
                <div className="grid grid-cols-[3rem_1fr] gap-4 py-5 sm:grid-cols-[4rem_0.65fr_1fr] sm:items-center">
                  <span className="font-display text-xl text-accent">0{index + 1}</span>
                  <h3 className="font-display text-3xl text-ink">{wood.name}</h3>
                  <p className="col-start-2 text-sm leading-6 text-muted sm:col-start-auto">{wood.note}</p>
                </div>
              </MaskReveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
