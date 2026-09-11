import { CmsPage } from "@/components/cms/cms-page";
import { ButtonLink } from "@/components/ui/button";
import { LabourForm } from "@/features/cms/labour-form";
export const metadata = { title: "Add labour entry" };
export default async function NewLabourPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const labourEntriesHref = /^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(month ?? "")
    ? `/factory/expenses/labour?month=${month}`
    : "/factory/expenses/labour";
  return <CmsPage title="Add labour entry" backHref={labourEntriesHref} actions={<ButtonLink href={labourEntriesHref} size="sm" variant="outline">View labour entries</ButtonLink>}><LabourForm month={month} /></CmsPage>;
}
