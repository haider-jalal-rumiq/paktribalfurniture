import Link from "next/link";
import { Plus } from "lucide-react";

import { CmsPage, EmptyState } from "@/components/cms/cms-page";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { shopInvoiceNumber, showDate } from "@/lib/accounting-core";
import { getShopInvoices } from "@/lib/cms";
import { formatPkr } from "@/lib/money";

export const metadata = { title: "Shop invoices" };

export default async function ShopInvoicesPage() {
  const invoices = await getShopInvoices();
  const total = invoices.reduce((sum, row) => (row.status === "issued" ? sum + BigInt(row.total_amount) : sum), 0n);

  return (
    <CmsPage
      title="Invoices"
      eyebrow="Pak Tribal Furniture"
      actions={<ButtonLink href="/shop/invoices/new" size="sm"><Plus className="h-4 w-4" aria-hidden="true" />New invoice</ButtonLink>}
    >
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-muted">{invoices.length} invoices · all dates</p>
        <p className="break-all text-lg font-bold tabular-nums text-accent">{formatPkr(total)}</p>
      </div>

      {invoices.length ? (
        <ul className="divide-y divide-hairline overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[var(--shadow-card)]">
          {invoices.map((row) => (
            <li key={row.id}>
              <Link className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-wash/50" href={`/shop/invoices/${row.id}`}>
                <div className="min-w-0">
                  <p className="text-sm font-bold">{shopInvoiceNumber(row.invoice_no)}</p>
                  <p className="mt-1 break-words text-xs text-muted">
                    {row.customer_name} · {showDate(row.issued_on)} · {row.items.length} items
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {row.status === "void" && <Badge tone="warn">Voided</Badge>}
                  <span className="break-all text-sm font-semibold tabular-nums">{formatPkr(row.total_amount)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>No shop invoices yet.</EmptyState>
      )}
    </CmsPage>
  );
}
