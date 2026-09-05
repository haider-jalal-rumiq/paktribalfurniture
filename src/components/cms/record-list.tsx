import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/cms/cms-page";

export interface RecordRow {
  id: string;
  href?: string;
  /** Small square at the left: initials, an icon, a status dot. */
  lead?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right column, top line — usually money or a badge. */
  meta?: ReactNode;
  /** Right column, second line. */
  metaSub?: ReactNode;
  actions?: ReactNode;
}

/**
 * One stacked row per record. Deliberately not a table: the CMS is read on a
 * phone far more often than a desktop, and a horizontally scrolling table is
 * unusable there. Rows grow to two columns from `sm` up rather than becoming
 * a grid, which keeps one layout to reason about.
 */
export function RecordList({
  rows,
  empty,
  emptyIcon,
}: {
  rows: RecordRow[];
  empty: ReactNode;
  emptyIcon?: ReactNode;
}) {
  if (!rows.length) return <EmptyState icon={emptyIcon}>{empty}</EmptyState>;

  return (
    <ul className="divide-y divide-hairline overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)]">
      {rows.map((row) => {
        const body = (
          <>
            {row.lead && <div className="shrink-0">{row.lead}</div>}
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold leading-snug text-ink">{row.title}</div>
              {row.subtitle && (
                <div className="mt-0.5 truncate text-sm text-muted">{row.subtitle}</div>
              )}
            </div>
            {(row.meta || row.metaSub) && (
              <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                {row.meta}
                {row.metaSub && <div className="text-xs text-muted">{row.metaSub}</div>}
              </div>
            )}
            {row.href && (
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                aria-hidden="true"
              />
            )}
          </>
        );

        return (
          <li key={row.id}>
            {row.href ? (
              <Link
                href={row.href}
                className="group flex min-h-[4.25rem] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-wash/50 focus-visible:bg-wash/50"
              >
                {body}
              </Link>
            ) : (
              <div className="flex min-h-[4.25rem] items-center gap-3 px-4 py-3.5">
                {body}
                {row.actions}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Initials chip used as the `lead` for clients. */
export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-wash text-sm font-bold text-ink-soft"
    >
      {initials || "?"}
    </span>
  );
}
