"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, Settings, Users, Wallet } from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/cms", label: "Home", icon: LayoutDashboard },
  { href: "/cms/orders", label: "Orders", icon: ClipboardList },
  { href: "/cms/clients", label: "Clients", icon: Users },
  { href: "/cms/expenses", label: "Expenses", icon: Wallet },
  { href: "/cms/settings", label: "Settings", icon: Settings },
] as const satisfies readonly {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[];

function isActive(pathname: string, href: string): boolean {
  return href === "/cms" ? pathname === "/cms" : pathname.startsWith(href);
}

export function CmsNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Phone: a compact brand bar, since there is no site header here. */}
      <div className="sticky top-0 z-30 border-b border-hairline bg-canvas/90 backdrop-blur sm:hidden">
        <Link href="/cms" className="flex min-h-14 items-center gap-2.5 px-4">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={28}
            height={28}
            className="rounded-md"
            priority
          />
          <span className="text-sm font-bold uppercase tracking-[0.16em] text-ink">
            PTF Orders
          </span>
        </Link>
      </div>

      {/* Tablet and up: a single horizontal bar with the brand and the tabs. */}
      <nav
        aria-label="Sections"
        className="sticky top-0 z-30 hidden border-b border-hairline bg-canvas/90 backdrop-blur sm:block"
      >
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-1 px-8">
          <Link href="/cms" className="mr-4 flex shrink-0 items-center gap-2.5">
            <Image src="/icons/icon-192.png" alt="" width={30} height={30} className="rounded-md" />
            <span className="text-sm font-bold uppercase tracking-[0.16em] text-ink">
              PTF Orders
            </span>
          </Link>
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex min-h-14 items-center gap-2 px-3.5 text-sm font-semibold transition-colors",
                  active ? "text-accent" : "text-ink-soft hover:text-ink",
                )}
              >
                <tab.icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Phone: bottom tab bar. Thumb-reachable, 56px targets, safe-area aware. */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <div className="grid grid-cols-5 px-1">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="group flex min-h-[3.5rem] flex-col items-center justify-center gap-1 py-1.5"
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-[var(--radius-pill)] transition-colors",
                    active ? "bg-accent/12 text-accent" : "text-muted",
                  )}
                >
                  <tab.icon className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    "text-[0.7rem] font-semibold leading-none",
                    active ? "text-accent" : "text-muted",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
