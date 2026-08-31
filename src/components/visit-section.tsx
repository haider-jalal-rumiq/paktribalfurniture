import { MapPin, Navigation, Phone } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import { landmarks, site } from "@/content/site";
import { HoursTable } from "@/features/hours/hours-table";
import { cn } from "@/lib/utils";
import { OpenStatus } from "@/features/hours/open-status";

const EMBED_QUERY = encodeURIComponent(
  `${site.address.street} ${site.address.suite}, ${site.address.city}, ${site.address.state} ${site.address.zip}`,
);

/**
 * Hours, map and directions. Shared by the home page and /contact — the same
 * information in the same shape, so nothing can fall out of sync.
 */
export function VisitSection({ heading = true }: { heading?: boolean }) {
  return (
    <section
      id="visit"
      className={heading ? "py-24 sm:py-32" : "pb-24 pt-16 sm:pb-32 sm:pt-20"}
    >
      <Container>
        {heading && (
          <SectionHeading
            eyebrow="Come see us"
            title="16th Street, just north of Indian School"
            lede="Free parking out front. If you can see the Phoenix Indian Medical Center, you are looking at us."
          />
        )}

        <div
          className={cn(
            "grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14",
            heading && "mt-12",
          )}
        >
          <div className="flex flex-col gap-8">
            <Reveal className="flex flex-col gap-4">
              <OpenStatus className="self-start" />
              <address className="not-italic">
                <a
                  href={site.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-start gap-3 font-display text-2xl leading-snug text-ink"
                >
                  <MapPin
                    className="mt-1.5 h-5 w-5 shrink-0 text-clay"
                    aria-hidden="true"
                  />
                  <span className="underline decoration-hairline decoration-2 underline-offset-[6px] transition-colors group-hover:decoration-clay">
                    {site.address.street}, {site.address.suite}
                    <br />
                    {site.address.city}, {site.address.state}{" "}
                    {site.address.zip}
                  </span>
                </a>
              </address>
              <a
                href={site.phoneHref}
                className="inline-flex items-center gap-3 text-lg font-medium text-ink-soft transition-colors hover:text-clay"
              >
                <Phone className="h-5 w-5 shrink-0 text-clay" aria-hidden="true" />
                {site.phone}
              </a>
            </Reveal>

            <Reveal delay={0.08} className="flex flex-col gap-4">
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-stone">
                Finding us
              </h3>
              <ul className="flex flex-col gap-4">
                {landmarks.map((landmark) => (
                  <li key={landmark.title}>
                    <p className="font-medium text-ink">{landmark.title}</p>
                    <p className="mt-1 leading-relaxed text-ink-soft">
                      {landmark.body}
                    </p>
                  </li>
                ))}
              </ul>
              <ButtonLink
                href={site.directionsUrl}
                target="_blank"
                rel="noreferrer"
                variant="outline"
                className="mt-2 self-start"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Get directions
              </ButtonLink>
            </Reveal>

            <Reveal delay={0.12} className="flex flex-col gap-4">
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-stone">
                Hours
              </h3>
              <HoursTable />
            </Reveal>
          </div>

          <Reveal
            delay={0.1}
            className="min-h-80 overflow-hidden rounded-[var(--radius-card)] border border-hairline lg:min-h-full"
          >
            <iframe
              title={`Map showing ${site.name} at ${site.address.street}, Phoenix`}
              src={`https://www.google.com/maps?q=${EMBED_QUERY}&z=16&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-80 w-full border-0"
            />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
