import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

import { CmsNav } from "@/components/cms/cms-nav";
import { cn } from "@/lib/utils";

/**
 * Every /cms screen. The site header and footer are suppressed for /cms by
 * ChromeGate in the root layout, so this is the whole chrome.
 *
 * Bottom padding clears the fixed mobile tab bar; `pb-32` is deliberate — a
 * sticky save bar can sit above the nav on form screens.
 */
export function CmsPage({
  title,
  eyebrow,
  actions,
  backHref,
  children,
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  /** Shows a back chevron before the title. Use on detail and create screens. */
  backHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="cms-shell min-h-[100dvh] bg-canvas">
      <CmsNav />

      <div className="cms-content mx-auto w-full max-w-[1180px] px-4 pb-32 pt-5 sm:px-8 sm:pb-16 sm:pt-9">
        <header className="cms-screen-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {backHref && (
              <Link
                href={backHref}
                className="-ml-1 mb-1 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-accent"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Link>
            )}
            {eyebrow && (
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
            )}
            <h1 className="mt-1.5 font-display text-[2rem] leading-[1.05] text-ink sm:text-[2.5rem]">
              {title}
            </h1>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
        </header>

        <div className="cms-body mt-6">{children}</div>
      </div>
    </div>
  );
}

/** The standard panel used across the CMS: soft corners, hairline, faint lift. */
export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={cn(
        "rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="font-display text-[1.4rem] leading-none text-ink sm:text-[1.65rem]">{children}</h2>
      {action}
    </div>
  );
}

/** Groups related fields inside a form so a long screen reads as steps. */
export function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Card as="section" className="p-4 sm:p-5">
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{title}</h3>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export function EmptyState({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      {icon && <div className="text-muted/70">{icon}</div>}
      <p className="max-w-sm text-sm leading-6 text-muted">{children}</p>
    </Card>
  );
}

export function NotConfigured() {
  return (
    <div className="rounded-[var(--radius-card)] border border-accent/30 bg-accent/8 p-5">
      <h2 className="font-display text-2xl text-ink">Connect Supabase to begin</h2>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        Apply <code className="text-accent-deep">supabase/schema.sql</code> then{" "}
        <code className="text-accent-deep">supabase/cms-schema.sql</code>, set the environment
        variables, and give your Supabase Auth user the admin role. The checklist is in README.md.
      </p>
    </div>
  );
}

/**
 * Sticky action bar for long forms. On a phone the save button would otherwise
 * sit far below the fold, so it rides above the tab bar instead.
 */
export function StickyActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 -mx-4 mt-8 border-t border-hairline bg-canvas/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
