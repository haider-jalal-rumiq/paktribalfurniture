import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { AppointmentSection } from "@/components/appointment-section";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Parallax, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import { FrameCard } from "@/features/eyewear/frame-card";
import { filterFrames } from "@/features/eyewear/frames";
import { JsonLd, breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Native Visions Eyewear",
  description:
    "Sundance Optical carries Native Visions Eyewear — frames designed by Native American artists, including featured artist Virgil “Smoker” Marchand. Exclusive in Phoenix.",
  path: "/native-visions",
});

export default function NativeVisionsPage() {
  const collection = filterFrames("Native Visions");

  return (
    <>
      <PageHero
        eyebrow="Exclusive to Sundance"
        title="Native Visions Eyewear"
        lede="Eyewear designed by true Native American artists. We are proud to carry the line — and prouder still of the people whose work it puts on the wall."
      />

      <section className="py-20 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:items-start lg:gap-20">
          <div className="flex flex-col gap-6">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
              Featured artist
            </span>
            <h2 className="font-display text-3xl text-ink md:text-4xl">
              Virgil &ldquo;Smoker&rdquo; Marchand
            </h2>

            <div className="flex flex-col gap-4 text-lg leading-relaxed text-ink-soft">
              <p>
                The sculptor Virgil Marchand was given his Indian name{" "}
                <em>Spa Poole</em> &mdash; smokey, or smoke, in his language
                &mdash; by his grandmother.
              </p>
              <p>
                He grew up on the Colville Eastside Reservation in Omak,
                Washington, and went to elementary school at St. Mary&apos;s
                Mission. He ran away five times.
              </p>
              <p>
                It was Smoker&apos;s brother who encouraged him to pursue his
                art. He went on to the Institute of American Indian Arts in
                Santa Fe, New Mexico &mdash; and that immersion drew out
                something he had never known was there. He graduated in 1971.
              </p>
            </div>

            <Reveal delay={0.1} className="pt-2">
              <p className="border-l-2 border-ember pl-5 font-display text-xl leading-snug text-ink">
                Frames like these are not stocked by chain optical shops. That
                is precisely why we carry them.
              </p>
            </Reveal>
          </div>

          <Parallax
            className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]"
            distance={30}
          >
            {/* placeholder: replace with photography of the real Native Visions display. */}
            <Image
              src="/images/native-visions-art.png"
              alt="Close detail of a Native Visions eyewear temple showing carved artwork"
              fill
              sizes="(min-width: 1024px) 42vw, 90vw"
              className="scale-110 object-cover"
            />
          </Parallax>
        </Container>
      </section>

      <section className="bg-canvas-deep py-20 sm:py-28">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-display text-3xl text-ink md:text-4xl">
              In the shop now
            </h2>
            <ButtonLink
              href="/eyewear?category=Native%20Visions"
              variant="outline"
              className="shrink-0"
            >
              See the full line
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>

          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" gap={0.07}>
            {collection.map((frame) => (
              <StaggerItem key={frame.id} className="h-full">
                <FrameCard frame={frame} className="h-full" />
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      <AppointmentSection />

      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Native Visions", path: "/native-visions" },
        ])}
      />
    </>
  );
}
