import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";

export function PageHero({ title, description, eyebrow }: { title: string; description: string; eyebrow?: string }) {
  return (
    <section className="border-b border-hairline pb-16 pt-36 sm:pb-20 sm:pt-40">
      <Container>
        <Reveal className="max-w-4xl">
          {eyebrow && <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>}
          <h1 className="max-w-3xl font-display text-5xl leading-[0.92] tracking-[-0.035em] text-ink sm:text-6xl lg:text-7xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">{description}</p>
        </Reveal>
      </Container>
    </section>
  );
}
