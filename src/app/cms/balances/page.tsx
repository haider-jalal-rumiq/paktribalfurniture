import { CmsPage, EmptyState, SectionHeading } from "@/components/cms/cms-page";
import { BalanceForm } from "@/features/cms/balance-form";
import { RecordAction } from "@/features/cms/record-action";
import { getBalanceEntries } from "@/lib/cms";
import { showDate, sumRupees } from "@/lib/accounting-core";
import { formatPkr } from "@/lib/money";
export const metadata = { title: "Add balance" };
export default async function BalancesPage() {
  const entries = await getBalanceEntries();
  return <CmsPage backHref="/cms" eyebrow="Business funds" title="Add balance">
    <p className="mb-5 max-w-2xl text-sm text-muted">Add your opening balance or money received. Every addition increases Credit; expenses reduce it.</p>
    <BalanceForm />
    <section className="mt-9"><SectionHeading>Balance history</SectionHeading><p className="mb-4 text-sm text-muted">Total added: <strong className="tabular-nums text-ink">{formatPkr(sumRupees(entries))}</strong></p>
      {entries.length ? <ul className="divide-y divide-hairline rounded-[var(--radius-card)] border border-hairline">{entries.map((row) => <li key={row.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="break-words font-semibold tabular-nums">{formatPkr(row.amount)}</p><p className="mt-1 break-words text-sm text-muted">{row.note} · {showDate(row.received_on)}</p></div><RecordAction url={`/api/cms/balances/${row.id}`} confirmation="Remove this balance entry? Available Credit will decrease by this amount." /></li>)}</ul> : <EmptyState>No balance added yet.</EmptyState>}
    </section>
  </CmsPage>;
}
