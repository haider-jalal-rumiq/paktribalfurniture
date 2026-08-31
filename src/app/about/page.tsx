import Image from "next/image";
import { Anchor, Award } from "lucide-react";

import { AppointmentSection } from "@/components/appointment-section";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Parallax, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { staff, timeline } from "@/content/site";
import { JsonLd, breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description:
    "Philip K. Clark, Arizona licensed optician (LDO-000417) and retired Navy Chief Petty Officer, has run Sundance Optical since 2014 — from a family serving Phoenix since 1951.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="The optician behind the counter"
        lede="No rotating staff, no commission targets. The person who fits your glasses is the person whose name is on the licence."
      />

      <section className="py-20 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-[0.9fr_1fr] lg:gap-20">
          {/*
            placeholder: a real headshot of Philip Clark belongs here. We do not
            generate a synthetic portrait of a real, named person — this
            credential card stands in until the client supplies a photograph.
          */}
          <Reveal className="flex flex-col gap-6 self-start rounded-[var(--radius-card)] border border-hairline bg-surface p-8 sm:p-10">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage/12 text-sage">
              <Anchor className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-3xl text-ink">{staff.name}</h2>
              <p className="mt-1 text-ink-soft">{staff.role}</p>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1 text-xs font-medium text-stone">
                <Award className="h-3.5 w-3.5" aria-hidden="true" />
                {staff.license}
              </p>
            </div>
            <p className="border-t border-hairline pt-6 leading-relaxed text-ink-soft">
              Forty-five years fitting glasses, twenty-three of them while also
              serving in the Navy Reserve. Sundance opened in 2014 as a shop of
              his own, sited on 16th Street so the neighbours it was built for
              could walk to it.
            </p>
          </Reveal>

          <div className="flex flex-col gap-8">
            <h2 className="font-display text-3xl text-ink">
              Licence, service and record
            </h2>
            <Stagger className="flex flex-col" gap={0.05}>
              {staff.credentials.map((line) => (
                <StaggerItem key={line}>
                  <div className="flex gap-4 border-b border-hairline py-4 last:border-b-0">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay"
                    />
                    <p className="leading-relaxed text-ink-soft">{line}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Container>
      </section>

      <section className="bg-canvas-deep py-20 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-20">
          <div className="flex flex-col gap-8">
            <h2 className="font-display text-3xl text-ink md:text-4xl">
              Three generations of it
            </h2>
            <ol className="flex flex-col gap-8">
              {timeline.map((entry, index) => (
                <Reveal key={entry.year} delay={index * 0.06}>
                  <li>
                    <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-clay">
                      {entry.year}
                    </p>
                    <h3 className="mt-1.5 font-display text-xl text-ink">
                      {entry.title}
                    </h3>
                    <p className="mt-1.5 max-w-lg leading-relaxed text-ink-soft">
                      {entry.body}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>

          <Parallax
            className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]"
            distance={28}
          >
            {/* placeholder: replace with a real photograph of the shop front. */}
            <Image
              src="/images/storefront.png"
              alt="The Sundance Optical storefront on North 16th Street in Phoenix"
              fill
              sizes="(min-width: 1024px) 42vw, 90vw"
              className="scale-110 object-cover"
            />
          </Parallax>
        </Container>
      </section>

      <AppointmentSection />

      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
    </>
  );
}
