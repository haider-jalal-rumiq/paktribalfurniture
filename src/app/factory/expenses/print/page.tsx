import { CmsPage } from "@/components/cms/cms-page";
import { FactoryExpenseDocument } from "@/components/cms/documents";
import { PrintButton } from "@/components/cms/print-button";
import { currentMonth, getFactoryMonthReport, isMonth, monthLabel } from "@/lib/cms";

export const metadata = { title: "Print expenses" };

export default async function PrintExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: requestedMonth } = await searchParams;
  const month = isMonth(requestedMonth) ? requestedMonth : currentMonth();
  const report = await getFactoryMonthReport(month);
  return <CmsPage title={`Expense report · ${monthLabel(month)}`} backHref={`/factory/expenses?month=${month}`} actions={<PrintButton />}>
    <p className="print-controls mb-5 text-sm text-muted">This report includes every general expense, labour payment and wood payment in the selected month. Choose Save as PDF to download it.</p>
    <FactoryExpenseDocument report={report} />
  </CmsPage>;
}
