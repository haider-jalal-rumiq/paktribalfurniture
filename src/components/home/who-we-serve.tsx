import Link from "next/link";
import { ArrowUpRight, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { Stagger, StaggerItem } from "@/components/motion";

interface Audience {
  icon: LucideIcon;
  title: string;
  body: string;
  points: readonly string[];
  href: string;
  cta: string;
}

/**
 * The coverage explainer lives here rather than on its own page — the three
 * groups the shop actually serves, each with the one fact they came looking for.
 */
const audiences: readonly Audience[] = [
  {
    icon: ShieldCheck,
    title: "Veterans",
    body: "A mile east of the Carl T. Hayden VA Medical Center, and owned by a retired Navy Chief Petty Officer.",
    points: [
      "Discounted exams and eyeglasses with a valid Veterans ID",
      "Walk-in adjustments and repairs",
    ],
    href: "/veterans",
    cta: "Veteran benefits",
  },
  {
    icon: HeartHandshake,
    title: "Native American families",
    body: "Directly across 16th Street from the Phoenix Indian Medical Center, next door to Drumbeats.",
    points: [
      "AHCCCS accepted for patients under 21 on the American Indian Health Plan",
      "Native Visions frames designed by Native artists",
    ],
    href: "/veterans#ahcccs",
    cta: "Coverage details",
  },
  {
    icon: Users,
    title: "Families and kids",
    body: "Bring the prescription from any doctor. We handle the rest, and we size children's frames properly.",
    points: [
      "Any doctor's eyeglass or contact lens prescription accepted",
      "Flexible, spring-hinged frames built for children",
    ],
    href: "/eyewear",
    cta: "Browse frames",
  },
];

export function WhoWeServe() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="Who we serve"
          title="Built around this neighbourhood"
          lede="Sundance sits where it does on purpose — within walking distance of the people it was opened to look after."
          align="center"
        />

        <Stagger className="mt-14 grid gap-6 md:grid-cols-3" gap={0.08}>
          {audiences.map(({ icon: Icon, ...audience }) => (
            <StaggerItem key={audience.title} className="h-full">
              <article className="flex h-full flex-col gap-4 rounded-[var(--radius-card)] border border-hairline bg-surface p-7">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sage/12 text-sage">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>

                <h3 className="font-display text-2xl text-ink">
                  {audience.title}
                </h3>
                <p className="leading-relaxed text-ink-soft">{audience.body}</p>

                <ul className="flex flex-col gap-2 text-sm text-ink-soft">
                  {audience.points.map((point) => (
                    <li key={point} className="flex gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay"
                      />
                      {point}
                    </li>
                  ))}
                </ul>

                <Link
                  href={audience.href}
                  className="group mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-semibold text-clay"
                >
                  {audience.cta}
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
