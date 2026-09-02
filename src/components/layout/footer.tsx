import Link from "next/link";
import { Camera, MessageCircle } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { navLinks } from "@/components/layout/nav";
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas-deep">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1fr] md:py-20">
        <div>
          <Logo className="w-44" />
          <p className="mt-5 max-w-sm text-sm leading-7 text-muted">
            A considered catalogue of furniture for homes that value natural materials, useful form, and Pakistani craft.
          </p>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Explore</h2>
          <ul className="mt-5 space-y-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm font-semibold text-ink-soft transition-colors hover:text-accent">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Connect</h2>
          <div className="mt-5 space-y-3">
            <a href={site.whatsapp.href} className="flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-accent">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {site.whatsapp.display}
            </a>
            <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-accent">
              <Camera className="h-4 w-4" aria-hidden="true" />
              @paktribalfurniture
            </a>
          </div>
        </div>
      </Container>
      <Container className="flex flex-col gap-3 border-t border-hairline py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/studio" className="hover:text-ink">Studio</Link>
        </div>
      </Container>
    </footer>
  );
}
