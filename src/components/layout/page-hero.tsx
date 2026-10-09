import { Container } from "@/components/layout/container";
import { MaskReveal, Reveal } from "@/components/motion";

export function PageHero({ title, description, eyebrow }: { title: string; description: string; eyebrow?: string }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-hairline pb-16 pt-36 sm:pb-20 sm:pt-40">
      <p aria-hidden="true" className="pointer-events-none absolute -bottom-[0.18em] left-1/2 -z-10 -translate-x-1/2 whitespace-nowrap font-display text-[clamp(8rem,24vw,22rem)] font-semibold leading-none tracking-[-0.08em] text-ink/[0.035]">
        {title}
      </p>
      <Container className="relative">
        <Reveal className="max-w-4xl">
          {eyebrow && <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>}
          <MaskReveal>
            <h1 className="max-w-3xl font-display text-5xl leading-[0.88] tracking-[-0.045em] text-ink sm:text-6xl lg:text-7xl">{title}</h1>
          </MaskReveal>
          <MaskReveal delay={0.08}>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">{description}</p>
          </MaskReveal>
        </Reveal>
      </Container>
    </section>
  );
}
