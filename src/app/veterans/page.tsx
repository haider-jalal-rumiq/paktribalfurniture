import { BadgeCheck, ExternalLink, Phone } from "lucide-react";

import { AppointmentSection } from "@/components/appointment-section";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/content/site";
import { JsonLd, breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Veterans & Coverage",
  description:
    "Discounted eye exams and eyeglasses for veterans with a valid VA ID, a mile from the Carl T. Hayden VA Medical Center. AHCCCS accepted for AIHP members under 21.",
  path: "/veterans",
});

const veteranPoints = [
  "Discounted comprehensive eye exams with a valid Veterans ID",
  "Discounted prescription eyeglasses",
  "A mile east of the Carl T. Hayden VA Medical Center",
  "Owned by a retired Navy Chief Petty Officer who served in Desert Shield / Desert Storm and Operation Enduring Freedom",
];

export default function VeteransPage() {
  return (
    <>
      <PageHero
        eyebrow="Veterans & coverage"
        title="Service earns more than a discount"
        lede="Sundance is owned and run by a retired Chief Petty Officer. If you served, you will be dealing with someone who understands what the paperwork is like."
      />

      <section className="py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <h2 className="font-display text-3xl text-ink">For our veterans</h2>
            <p className="text-lg leading-relaxed text-ink-soft">
              With a valid Veterans ID, discounted comprehensive eye exams and
              prescription eyeglasses are available at Sundance Optical.
            </p>

            <Stagger className="flex flex-col gap-3 pt-2" gap={0.06}>
              {veteranPoints.map((point) => (
                <StaggerItem key={point}>
                  <div className="flex gap-3">
                    <BadgeCheck
                      className="mt-0.5 h-5 w-5 shrink-0 text-sage"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed text-ink-soft">
                      {point}
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal delay={0.1} className="pt-2">
              <ButtonLink href={site.phoneHref} variant="outline">
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call {site.phone}
              </ButtonLink>
            </Reveal>
          </div>

          <Reveal
            delay={0.08}
            id="ahcccs"
            className="scroll-mt-28 flex flex-col gap-6 rounded-[var(--radius-card)] border border-hairline bg-surface p-8 sm:p-10"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
              AHCCCS &amp; AIHP
            </span>
            <h2 className="font-display text-3xl text-ink">
              Native American patients
            </h2>
            <p className="leading-relaxed text-ink-soft">
              We accept AHCCCS for Native American patients under 21 who are
              enrolled in the American Indian Health Plan (AIHP).
            </p>
            <p className="leading-relaxed text-ink-soft">
              If you are Native American and enrolled in a different plan, you
              may be able to change to AIHP by calling AHCCCS directly at{" "}
              <a
                href="tel:+16024177100"
                className="font-medium text-clay underline underline-offset-4"
              >
                (602) 417-7100
              </a>
              .
            </p>
            <p className="leading-relaxed text-ink-soft">
              We are directly across 16th Street from the Phoenix Indian Medical
              Center, next door to Drumbeats &mdash; close enough to walk.
            </p>

            <a
              href="https://www.azahcccs.gov/AmericanIndians/AIHP/"
              target="_blank"
              rel="noreferrer"
              className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-clay underline underline-offset-4"
            >
              Read about the American Indian Health Plan
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-hairline bg-canvas-deep py-16">
        <Container>
          <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <h2 className="font-display text-2xl text-ink">
              Not sure what you are covered for?
            </h2>
            <p className="leading-relaxed text-ink-soft">
              Ask before you commit to anything. Bring your prescription from
              any doctor, tell us your plan, and we will tell you plainly what
              it does and does not cover.
            </p>
          </Reveal>
        </Container>
      </section>

      <AppointmentSection />

      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Veterans & Coverage", path: "/veterans" },
        ])}
      />
    </>
  );
}
