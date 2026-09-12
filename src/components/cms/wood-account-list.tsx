import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { EmptyState } from "@/components/cms/cms-page";
import { ButtonLink } from "@/components/ui/button";
import { showDate, woodAccounts } from "@/lib/accounting-core";
import { monthLabel } from "@/lib/cms-core";
import { formatPkr } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { WoodEntry } from "@/types/database";

type WoodEvent = {
  amount: bigint;
  balanceAfter: bigint;
  date: string;
  entry: WoodEntry;
  kind: "purchase" | "payment";
};

function newEntryHref(month: string, purchaser: string, mode: "purchase" | "payment") {
  const query = new URLSearchParams({ month, purchaser, mode });
  return `/factory/expenses/wood/new?${query}`;
}

export function WoodAccountList({ entries, month }: { entries: WoodEntry[]; month: string }) {
  const accounts = woodAccounts(entries).sort((a, b) => a.name.localeCompare(b.name));
  if (!accounts.length) return <EmptyState>No purchaser accounts yet. Add the first wood purchase to begin.</EmptyState>;

  return <div className="space-y-4">
    {accounts.map((account) => {
      const chronological = account.entries.flatMap<WoodEvent>((entry) => {
        const rows: WoodEvent[] = [];
        if (entry.purchased_amount > 0) rows.push({ amount: BigInt(entry.purchased_amount), balanceAfter: 0n, date: entry.period, entry, kind: "purchase" });
        if (entry.paid_amount > 0) rows.push({ amount: BigInt(entry.paid_amount), balanceAfter: 0n, date: entry.paid_on, entry, kind: "payment" });
        return rows;
      }).sort((a, b) => a.date.localeCompare(b.date) || (a.kind === b.kind ? 0 : a.kind === "purchase" ? -1 : 1));
      let runningBalance = 0n;
      const events = chronological.map((event) => {
        runningBalance += event.kind === "purchase" ? event.amount : -event.amount;
        return { ...event, balanceAfter: runningBalance };
      }).reverse();

      return <details key={account.id} open={accounts.length === 1} className="wood-account overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)]">
        <summary className="flex min-h-20 cursor-pointer list-none items-center gap-3 px-4 py-4 sm:px-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent-deep" aria-hidden="true">{account.name.slice(0, 2).toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <span className="block break-words text-base font-bold text-accent-deep">{account.name}</span>
            <span className="mt-1 block text-xs text-muted">Purchased {formatPkr(account.purchased)} · Paid {formatPkr(account.paid)} · {events.length} transactions</span>
          </span>
          <span className="shrink-0 text-right">
            <span className={cn("block font-semibold tabular-nums", account.remaining > 0n ? "text-accent" : "text-ink")}>{formatPkr(account.remaining)}</span>
            <span className="mt-1 block text-xs text-muted">{account.remaining > 0n ? "remaining" : account.remaining < 0n ? "supplier credit" : "settled"}</span>
          </span>
          <ChevronRight className="tree-chevron h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        </summary>

        <div className="border-t border-hairline px-4 pb-4 sm:px-5">
          <div className="flex flex-wrap gap-2 py-4">
            <ButtonLink href={newEntryHref(month, account.name, "purchase")} size="sm">Add purchase</ButtonLink>
            <ButtonLink href={newEntryHref(month, account.name, "payment")} size="sm" variant="outline">Record payment</ButtonLink>
          </div>
          <ol className="divide-y divide-hairline border-t border-hairline">
            {events.map((event) => <li key={`${event.entry.id}-${event.kind}`}>
              <Link href={`/factory/expenses/wood/${event.entry.id}`} className="flex min-h-16 items-center gap-3 py-3 text-sm hover:text-accent">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", event.kind === "purchase" ? "bg-accent/10 text-accent-deep" : "bg-wash text-ink-soft")}>{event.kind === "purchase" ? "Purchase" : "Payment"}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted">{event.kind === "purchase" ? monthLabel(event.entry.period.slice(0, 7)) : showDate(event.date)}</span>
                  {event.entry.notes && <span className="mt-1 block truncate text-xs text-muted">{event.entry.notes}</span>}
                </span>
                <span className="shrink-0 text-right">
                  <span className={cn("block font-semibold tabular-nums", event.kind === "payment" && "text-accent-deep")}>{event.kind === "payment" ? "− " : "+ "}{formatPkr(event.amount)}</span>
                  <span className="mt-1 block text-xs tabular-nums text-muted">Balance {formatPkr(event.balanceAfter)}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              </Link>
            </li>)}
          </ol>
        </div>
      </details>;
    })}
  </div>;
}
