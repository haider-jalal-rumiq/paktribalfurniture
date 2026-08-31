"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Phone } from "lucide-react";

import { LogoMark } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { navLinks } from "@/components/layout/nav";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

const COMPACT_AT = 80;

export function Header() {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > COMPACT_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Only the home page puts a dark photograph behind the header. There the bar
  // is transparent with light text over a scrim; everywhere else it sits on the
  // pale page background and needs ink text to stay legible.
  const overlay = pathname === "/" && !compact;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ease-[var(--ease-out-soft)]",
        compact
          ? "border-hairline bg-canvas/85 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      {/* Scrim: keeps light nav text readable over a bright patch of the hero. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/75 to-transparent transition-opacity duration-300",
          overlay ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        className={cn(
          "relative mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 transition-all duration-300 ease-[var(--ease-out-soft)] sm:px-8",
          compact ? "py-3" : "py-5",
        )}
      >
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label={`${site.name} — home`}
        >
          <LogoMark
            className={cn(
              "transition-[transform,color] duration-500 ease-[var(--ease-out-soft)] group-hover:rotate-[-8deg]",
              overlay ? "text-ember" : "text-clay",
            )}
          />
          <span className="flex flex-col leading-none">
            <span
              className={cn(
                "whitespace-nowrap font-display text-lg font-semibold tracking-tight transition-colors sm:text-xl",
                overlay ? "text-canvas" : "text-ink",
              )}
            >
              Sundance Optical
            </span>
            <span
              className={cn(
                "mt-1 whitespace-nowrap text-[0.65rem] font-medium uppercase tracking-[0.16em] transition-colors",
                overlay ? "text-canvas/70" : "text-stone",
              )}
            >
              {site.tagline}
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-6 xl:gap-7">
            {navLinks.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative whitespace-nowrap py-1 text-sm font-medium transition-colors",
                      overlay
                        ? "text-canvas/85 hover:text-canvas"
                        : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {link.label}
                    <span
                      className={cn(
                        "absolute inset-x-0 -bottom-0.5 h-px origin-left transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:scale-x-100",
                        overlay ? "bg-ember" : "bg-clay",
                        active ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={site.phoneHref}
            className={cn(
              "hidden items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors xl:inline-flex",
              overlay
                ? "text-canvas/85 hover:text-canvas"
                : "text-ink-soft hover:text-clay",
            )}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {site.phone}
          </a>
          <ButtonLink
            href="/contact#appointment"
            size="sm"
            className="hidden whitespace-nowrap sm:inline-flex"
          >
            Request an appointment
          </ButtonLink>
          <MobileNav overlay={overlay} />
        </div>
      </div>
    </header>
  );
}
