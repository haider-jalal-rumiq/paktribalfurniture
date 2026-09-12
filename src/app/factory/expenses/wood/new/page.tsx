import { CmsPage } from "@/components/cms/cms-page";
import { ButtonLink } from "@/components/ui/button";
import { WoodForm, type WoodEntryMode } from "@/features/cms/wood-form";
import { getAllWoodEntries } from "@/lib/cms";

export const metadata = { title: "Add wood entry" };

export default async function NewWoodPage({ searchParams }: { searchParams: Promise<{ month?: string; mode?: string; purchaser?: string }> }) {
  const { month, mode: requestedMode, purchaser: requestedPurchaser } = await searchParams;
  const validMonth = /^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(month ?? "") ? month : undefined;
  const mode: WoodEntryMode = requestedMode === "payment" ? "payment" : "purchase";
  const back = validMonth ? `/factory/expenses/wood?month=${validMonth}` : "/factory/expenses/wood";
  const entries = await getAllWoodEntries();
  const purchasers = [...new Set(entries.map((entry) => entry.purchaser_name))].sort();
  const defaultPurchaser = purchasers.find((name) => name.toLocaleLowerCase("en") === requestedPurchaser?.trim().toLocaleLowerCase("en"));
  const title = mode === "payment" ? "Record wood payment" : "Add wood purchase";
  return <CmsPage title={title} backHref={back} actions={<ButtonLink href={back} size="sm" variant="outline">View wood accounts</ButtonLink>}>
    <WoodForm month={validMonth} purchasers={purchasers} defaultPurchaser={defaultPurchaser} initialMode={mode} />
  </CmsPage>;
}
