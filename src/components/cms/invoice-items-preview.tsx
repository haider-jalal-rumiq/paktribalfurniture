import { formatPkr, parseAmount } from "@/lib/money";

export type PreviewItem = { id: string; item: string; quantity: string; amount: string; source: string };

/**
 * The invoice lines as they will print, updating while the fields above are
 * typed. A long invoice is entered as a tall column of fieldsets where it is
 * easy to lose track of what has already been added, so this is the check
 * before saving. Incomplete rows still appear, with the gaps shown as "—"
 * rather than hidden — a missing amount is the thing worth noticing.
 */
export function InvoiceItemsPreview({ items }: { items: PreviewItem[] }) {
  if (!items.length) return null;

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-hairline bg-surface">
      <table className="document-table">
        <caption className="sr-only">The invoice items entered so far. Amounts are in Pakistani rupees.</caption>
        <thead>
          <tr>
            <th scope="col" aria-label="Serial number">S.No.</th>
            <th scope="col">Item</th>
            <th scope="col" className="number">Qty</th>
            <th scope="col" className="number">Unit</th>
            <th scope="col" className="number">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, index) => {
            const amount = parseAmount(row.amount);
            const quantity = Number(row.quantity);
            const validQuantity = Number.isInteger(quantity) && quantity > 0 && quantity <= 10000;
            const lineTotal = amount !== null && validQuantity ? BigInt(amount) * BigInt(quantity) : null;

            return (
              <tr key={row.id}>
                <td data-label="S.No." className="tabular-nums">{index + 1}</td>
                <td data-label="Item">
                  {row.item.trim()
                    ? <span className="font-semibold">{row.item}</span>
                    : <span className="text-muted">Not named yet</span>}
                  {row.source.trim() && <p className="mt-1 text-xs text-muted">{row.source}</p>}
                </td>
                <td data-label="Qty" className="number">{validQuantity ? quantity : "—"}</td>
                <td data-label="Unit" className="number">{amount === null ? "—" : formatPkr(amount)}</td>
                <td data-label="Total" className="number font-semibold">
                  {lineTotal === null ? "—" : formatPkr(lineTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
