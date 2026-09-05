"use client";

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
] as const satisfies readonly { href: string; label: string; icon: ComponentType<{ className?: string }> }[];

function isActive(pathname: string, href: string): boolean {
  return href === "/cms" ? pathname === "/cms" : pathname.startsWith(href);
}

/** Bottom tab bar on phones, a top row from sm up. */
export function CmsNav() {
  const pathname = usePathname();

  return (
    <>
      <nav
        aria-label="Sections"
        className="sticky top-0 z-30 hidden border-b border-hairline bg-canvas/95 backdrop-blur sm:block"
      >
        <div className="mx-auto flex w-full max-w-[1400px] items-center gap-1 px-5 sm:px-8 lg:px-12">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-14 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors",
                  active
                    ? "border-accent text-accent"
                    : "border-transparent text-ink-soft hover:text-ink",
                )}
              >
                <tab.icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <div className="grid grid-cols-5">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[0.66rem] font-semibold transition-colors",
                  active ? "text-accent" : "text-muted",
                )}
              >
                <tab.icon className="h-5 w-5" aria-hidden="true" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
