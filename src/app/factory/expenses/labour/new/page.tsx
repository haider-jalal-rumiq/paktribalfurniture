import { CmsPage } from "@/components/cms/cms-page";
import { LabourForm } from "@/features/cms/labour-form";
export const metadata = { title: "Add labour entry" };
export default async function NewLabourPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  return <CmsPage title="Add labour entry" backHref="/factory/expenses/labour"><LabourForm month={month} /></CmsPage>;
}
