import type { ReactNode } from "react";

import { CmsNav } from "@/components/cms/cms-nav";
import { Container } from "@/components/layout/container";

/**
 * Every /cms screen. Bottom padding clears the fixed mobile tab bar; the site
 * header and footer are suppressed for /cms by ChromeGate in the root layout.
 */
export function CmsPage({
  title,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-canvas">
      <CmsNav />
      <Container className="pb-28 pt-6 sm:pb-16 sm:pt-10">
        <div className="flex flex-col gap-4 border-b border-hairline pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow && (
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
            )}
            <h1 className="mt-2 font-display text-4xl leading-none text-ink sm:text-5xl">{title}</h1>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
        {children}
      </Container>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="border border-hairline bg-surface p-6 text-sm leading-6 text-muted">
      {children}
    </div>
  );
}

export function NotConfigured() {
  return (
    <div className="mt-8 border border-accent/30 bg-accent/8 p-5">
      <h2 className="font-display text-2xl text-ink">Connect Supabase to begin</h2>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        Apply <code className="text-accent-deep">supabase/schema.sql</code> then{" "}
        <code className="text-accent-deep">supabase/cms-schema.sql</code>, set the environment
        variables, and give your Supabase Auth user the admin role. The checklist is in README.md.
      </p>
    </div>
  );
}
