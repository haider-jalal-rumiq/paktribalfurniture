import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Stagger, StaggerItem } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import { OpenStatus } from "@/features/hours/open-status";

const HEADLINE = [
  "Three generations",
  "of Phoenix eyes,",
  "cared for on 16th Street.",
];

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden pb-16 pt-40 sm:pb-24">
      {/* placeholder: replace with a real photograph of the shop interior. */}
      <Image
        src="/images/hero-shop.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="ken-burns -z-20 object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/75 to-ink/25"
      />

      <Container>
        <Stagger className="flex flex-col items-start gap-7" gap={0.08}>
          <StaggerItem y={12}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-canvas backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-ember" aria-hidden="true" />
              Veteran owned and operated
            </span>
          </StaggerItem>

          <h1 className="font-display text-4xl text-canvas sm:text-5xl">
            {HEADLINE.map((line, index) => (
              <span key={line} className="block overflow-hidden pb-1">
                <StaggerItem y="100%">
                  <span
                    className={index === 2 ? "block text-ember" : "block"}
                  >
                    {line}
                  </span>
                </StaggerItem>
              </span>
            ))}
          </h1>

          <StaggerItem>
            <p className="max-w-xl text-lg leading-relaxed text-canvas/80">
              Licensed opticians in central Phoenix. We take any doctor&apos;s
              prescription, fit it properly, and stand behind it &mdash; the way
              our family has since 1951.
            </p>
          </StaggerItem>

          <StaggerItem className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/contact#appointment" size="lg">
              Request an appointment
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/eyewear" variant="onDark" size="lg">
              Browse frames
            </ButtonLink>
          </StaggerItem>

          <StaggerItem>
            <OpenStatus tone="dark" />
          </StaggerItem>
        </Stagger>
      </Container>
    </section>
  );
}
