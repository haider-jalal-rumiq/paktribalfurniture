import { CmsPage } from "@/components/cms/cms-page";
import { FactoryDashboardDocument } from "@/components/cms/documents";
import { PrintButton } from "@/components/cms/print-button";
import { currentMonth, getFactoryMonthReport, isMonth, monthLabel } from "@/lib/cms";

export const metadata = { title: "Print dashboard" };

export default async function PrintDashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: requestedMonth } = await searchParams;
  const month = isMonth(requestedMonth) ? requestedMonth : currentMonth();
  const report = await getFactoryMonthReport(month);
  return <CmsPage title={`Dashboard · ${monthLabel(month)}`} backHref={`/factory?month=${month}`} actions={<PrintButton />}>
    <p className="print-controls mb-5 text-sm text-muted">Choose Save as PDF in the print window to download this monthly dashboard.</p>
    <FactoryDashboardDocument report={report} />
  </CmsPage>;
}
