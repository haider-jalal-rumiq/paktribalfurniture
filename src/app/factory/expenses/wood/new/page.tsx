import { CmsPage } from "@/components/cms/cms-page";
import { ButtonLink } from "@/components/ui/button";
import { WoodForm } from "@/features/cms/wood-form";
import { getAllWoodEntries } from "@/lib/cms";

export const metadata = { title: "Add wood entry" };

export default async function NewWoodPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const validMonth = /^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(month ?? "") ? month : undefined;
  const back = validMonth ? `/factory/expenses/wood?month=${validMonth}` : "/factory/expenses/wood";
  const entries = await getAllWoodEntries();
  const purchasers = [...new Set(entries.map((entry) => entry.purchaser_name))].sort();
  return <CmsPage title="Add wood entry" backHref={back} actions={<ButtonLink href={back} size="sm" variant="outline">View wood entries</ButtonLink>}>
    <WoodForm month={validMonth} purchasers={purchasers} />
  </CmsPage>;
}
