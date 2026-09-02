"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { navLinks } from "@/components/layout/nav";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,padding] duration-300",
        compact
          ? "border-hairline bg-canvas/92 backdrop-blur-xl"
          : "border-transparent bg-canvas/78 backdrop-blur-md",
      )}
    >
      <Container className={cn("flex items-center justify-between gap-5 transition-[height] duration-300", compact ? "h-16" : "h-20")}>
        <Link href="/" aria-label={`${site.name} home`} className="shrink-0">
          <Logo className={cn("transition-[width] duration-300", compact && "w-[8.5rem] sm:w-[9.5rem]")} />
        </Link>

        <nav aria-label="Main navigation" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {navLinks.map((link) => {
              const active = link.href === "/#materials"
                ? false
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-accent after:transition-transform",
                      active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/contact#enquiry" size="sm" className="hidden sm:inline-flex">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Send an enquiry
          </ButtonLink>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
