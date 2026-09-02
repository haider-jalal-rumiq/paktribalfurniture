import { Container } from "@/components/layout/container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { woodTypes } from "@/content/site";

export function Materials() {
  return (
    <section id="materials" className="scroll-mt-24 border-y border-hairline bg-canvas-deep py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <Reveal>
            <p className="font-display text-4xl leading-[1.02] text-ink sm:text-5xl">The material changes how a piece feels, ages, and holds a room.</p>
          </Reveal>
          <Stagger className="divide-y divide-hairline border-y border-hairline">
            {woodTypes.map((wood, index) => (
              <StaggerItem key={wood.slug}>
                <div className="grid grid-cols-[3rem_1fr] gap-4 py-5 sm:grid-cols-[4rem_0.65fr_1fr] sm:items-center">
                  <span className="font-display text-xl text-accent">0{index + 1}</span>
                  <h3 className="font-display text-3xl text-ink">{wood.name}</h3>
                  <p className="col-start-2 text-sm leading-6 text-muted sm:col-start-auto">{wood.note}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Container>
    </section>
  );
}
