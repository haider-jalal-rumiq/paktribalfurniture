import { CmsPage, EmptyState } from "@/components/cms/cms-page";
import { LabourDocument } from "@/components/cms/documents";
import { PrintButton } from "@/components/cms/print-button";
import { currentMonth, getLabourEntries } from "@/lib/cms";
export const metadata = { title: "Print labour sheet" };
export default async function PrintLabourPage({ searchParams }: { searchParams: Promise<{ month?: string; entry?: string }> }) {
  const params = await searchParams;
  const month = params.month && /^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(params.month) ? params.month : currentMonth();
  const all = await getLabourEntries(month);
  const entries = params.entry ? all.filter((row) => row.id === params.entry) : all;
  return <CmsPage title="Print labour sheet" backHref={`/cms/expenses/labour?month=${month}`} actions={entries.length ? <PrintButton /> : undefined}>
    {entries.length ? <><p className="print-controls mb-5 text-sm text-muted">Choose Save as PDF in the print window to download this sheet.</p><LabourDocument entries={entries} month={month} /></> : <EmptyState>No labour entries to print.</EmptyState>}
  </CmsPage>;
}
