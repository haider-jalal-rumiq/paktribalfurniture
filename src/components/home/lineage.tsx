import Image from "next/image";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { CountUp, DrawLine, Parallax, Reveal } from "@/components/motion";
import { timeline } from "@/content/site";

export function Lineage() {
  return (
    <section className="py-24 sm:py-32">
      <Container className="grid gap-16 lg:grid-cols-[0.85fr_1fr] lg:gap-20">
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Since 1951"
            title="A family trade, not a franchise"
            lede="No call centre, no rotating staff, no upsell script. The person who fits your glasses is the person who owns the shop."
          />

          <Reveal className="flex gap-10" delay={0.1}>
            <div className="flex flex-col">
              <span className="font-display text-4xl text-clay">
                <CountUp to={1951} from={1900} />
              </span>
              <span className="mt-1 text-sm text-stone">
                The family started
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-4xl text-clay">
                <CountUp to={70} from={0} />
                <span aria-hidden="true">+</span>
              </span>
              <span className="mt-1 text-sm text-stone">
                Years caring for Phoenix eyes
              </span>
            </div>
          </Reveal>

          <Parallax
            className="relative mt-2 aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] lg:aspect-[4/3]"
            distance={28}
          >
            {/* placeholder: replace with a real photo of a fitting in the shop. */}
            <Image
              src="/images/optician-fitting.png"
              alt="An optician adjusting a pair of eyeglass frames for a customer"
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="scale-110 object-cover"
            />
          </Parallax>
        </div>

        <ol className="relative flex flex-col gap-12 pl-10">
          <DrawLine className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px" />

          {timeline.map((entry, index) => (
            <Reveal key={entry.year} delay={index * 0.08}>
              <li className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-10 top-2 h-[15px] w-[15px] rounded-full border-[3px] border-canvas bg-clay ring-1 ring-hairline"
                />
                <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-clay">
                  {entry.year}
                </p>
                <h3 className="mt-2 font-display text-2xl text-ink">
                  {entry.title}
                </h3>
                <p className="mt-2 max-w-md leading-relaxed text-ink-soft">
                  {entry.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
