import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export interface RecordRow {
  id: string;
  href?: string;
  /** Main line. */
  title: ReactNode;
  /** Second line under the title. */
  subtitle?: ReactNode;
  /** Right-hand column: amount, status, date. */
  meta?: ReactNode;
  /** Smaller line under the meta. */
  metaSub?: ReactNode;
}

/**
 * One stacked row per record. Deliberately not a table: this is read on a phone
 * far more often than on a desktop, and a horizontally scrolling table is
 * unusable there.
 */
export function RecordList({ rows, empty }: { rows: RecordRow[]; empty: ReactNode }) {
  if (!rows.length) {
    return (
      <div className="border border-hairline bg-surface p-6 text-sm leading-6 text-muted">{empty}</div>
    );
  }

  return (
    <ul className="divide-y divide-hairline border-y border-hairline">
      {rows.map((row) => {
        const body = (
          <>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-ink">{row.title}</div>
              {row.subtitle && <div className="mt-1 truncate text-sm text-muted">{row.subtitle}</div>}
            </div>
            {(row.meta || row.metaSub) && (
              <div className="shrink-0 text-right">
                {row.meta && <div className="text-sm font-semibold text-ink-soft">{row.meta}</div>}
                {row.metaSub && <div className="mt-1 text-xs text-muted">{row.metaSub}</div>}
              </div>
            )}
            {row.href && <ArrowUpRight className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />}
          </>
        );

        return (
          <li key={row.id}>
            {row.href ? (
              <Link
                href={row.href}
                className="flex min-h-16 items-center gap-3 py-4 transition-colors hover:bg-wash sm:px-3"
              >
                {body}
              </Link>
            ) : (
              <div className="flex min-h-16 items-center gap-3 py-4 sm:px-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
