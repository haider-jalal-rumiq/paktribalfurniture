import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/layout/logo";
import { navLinks } from "@/components/layout/nav";
import { HoursTable } from "@/features/hours/hours-table";
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-canvas">
      <Container className="grid gap-12 py-16 md:grid-cols-3 md:py-20">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <LogoMark className="text-ember" />
            <span className="font-display text-xl font-semibold">
              Sundance Optical
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-canvas/65">
            Licensed opticians on 16th Street. From a family caring for Phoenix
            eyes since 1951.
          </p>
          <ul className="flex flex-col gap-3 text-sm">
            <li>
              <a
                href={site.phoneHref}
                className="inline-flex items-center gap-2.5 text-canvas/80 transition-colors hover:text-ember"
              >
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                {site.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2.5 text-canvas/80 transition-colors hover:text-ember"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                {site.email}
              </a>
            </li>
            <li>
              <a
                href={site.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-start gap-2.5 text-canvas/80 transition-colors hover:text-ember"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {site.address.street}, {site.address.suite}
                  <br />
                  {site.address.city}, {site.address.state} {site.address.zip}
                </span>
              </a>
            </li>
          </ul>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-ember">
            Explore
          </h2>
          <ul className="flex flex-col gap-3 text-sm">
            {[{ label: "Home", href: "/" }, ...navLinks].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-canvas/80 transition-colors hover:text-ember"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-ember">
            Hours
          </h2>
          <HoursTable tone="dark" />
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-canvas/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.legalName}. All rights reserved.
          </p>
          <p>Veteran owned and operated in Phoenix, Arizona.</p>
        </Container>
      </div>
    </footer>
  );
}
