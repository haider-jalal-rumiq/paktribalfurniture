"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { invoiceNumber, showDate } from "@/lib/accounting-core";
import { formatPkr } from "@/lib/money";
import type { Invoice } from "@/types/database";

/**
 * One client's invoice list, with a checkbox per row so a few of that
 * client's own invoices can be picked and combined into a single billable
 * PDF — e.g. an institution that gets billed once for several deliveries.
 * Selection never crosses a client: each client's group carries its own
 * selection state, so there is nothing to reconcile across sections.
 */
export function InvoiceClientGroup({ clientName, invoices, combinable }: { clientName: string; invoices: Invoice[]; combinable: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const toggle = (id: string) => setSelected((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const combine = () => router.push(`/factory/invoices/combined?ids=${[...selected].join(",")}`);

  return (
    <section className="mb-6 overflow-hidden rounded-[var(--radius-card)] border border-hairline">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-canvas-deep px-4 py-4">
        <h2 className="font-display text-xl">{clientName}</h2>
        {selected.size > 0 && (
          <Button type="button" size="sm" onClick={combine}>
            <Layers className="h-4 w-4" aria-hidden="true" />
            Generate total invoice ({selected.size})
          </Button>
        )}
      </div>
      <ul className="divide-y divide-hairline">
        {invoices.map((row) => (
          <li key={row.id} className="flex items-center gap-3 p-4 hover:bg-wash/50">
            {combinable && (
              <input
                type="checkbox"
                aria-label={`Select ${invoiceNumber(row.invoice_no)} to combine`}
                checked={selected.has(row.id)}
                onChange={() => toggle(row.id)}
                className="h-5 w-5 shrink-0 accent-accent"
              />
            )}
            <Link className="flex flex-1 flex-wrap items-center justify-between gap-3" href={`/factory/invoices/${row.id}`}>
              <div>
                <p className="text-sm font-bold">{invoiceNumber(row.invoice_no)}</p>
                <p className="mt-1 text-xs text-muted">{showDate(row.issued_on)} · {row.items.length} items</p>
              </div>
              <span className="break-all text-sm font-semibold tabular-nums">{formatPkr(row.total_amount)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
