import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { EmptyState } from "@/components/cms/cms-page";
import { woodAccounts } from "@/lib/accounting-core";
import { formatPkr } from "@/lib/money";
import { woodSupplierHref } from "@/lib/wood-links";
import { cn } from "@/lib/utils";
import type { WoodEntry } from "@/types/database";

/** A purchase and a payment on the same entry count as two transactions. */
function transactionCount(entries: WoodEntry[]): number {
  return entries.reduce((count, entry) => count + (entry.purchased_amount > 0 ? 1 : 0) + (entry.paid_amount > 0 ? 1 : 0), 0);
}

const pluralTransactions = (count: number): string => `${count} ${count === 1 ? "transaction" : "transactions"}`;

export function WoodAccountList({ entries }: { entries: WoodEntry[] }) {
  const accounts = woodAccounts(entries).sort((a, b) => a.name.localeCompare(b.name));
  if (!accounts.length) return <EmptyState>No wood suppliers yet. Add the first wood purchase to begin.</EmptyState>;

  return <ul className="divide-y divide-hairline overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)]">
    {accounts.map((account) => <li key={account.id}>
      <Link href={woodSupplierHref(account.name)} className="flex min-h-20 items-center gap-3 px-4 py-4 hover:bg-wash/50 sm:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent-deep" aria-hidden="true">{account.name.slice(0, 2).toUpperCase()}</span>
        <span className="min-w-0 flex-1">
          <span className="block break-words text-base font-bold text-accent-deep">{account.name}</span>
          <span className="mt-1 block text-xs text-muted">Purchased {formatPkr(account.purchased)} · Paid {formatPkr(account.paid)} · {pluralTransactions(transactionCount(account.entries))}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className={cn("block font-semibold tabular-nums", account.remaining > 0n ? "text-accent" : "text-ink")}>{formatPkr(account.remaining)}</span>
          <span className="mt-1 block text-xs text-muted">{account.remaining > 0n ? "remaining" : account.remaining < 0n ? "supplier credit" : "settled"}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
      </Link>
    </li>)}
  </ul>;
}
