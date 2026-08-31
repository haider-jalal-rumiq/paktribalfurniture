import { Container } from "@/components/layout/container";
import { Stagger, StaggerItem } from "@/components/motion";
import { trustPoints } from "@/content/site";

export function TrustStrip() {
  return (
    <section className="border-b border-hairline bg-canvas-deep py-6">
      <Container>
        <Stagger
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center"
          gap={0.05}
        >
          {trustPoints.map((point) => (
            <StaggerItem key={point} y={10}>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
                {point}
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
