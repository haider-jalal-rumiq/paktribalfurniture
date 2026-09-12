import { notFound } from "next/navigation";

import { CmsPage } from "@/components/cms/cms-page";
import { WoodForm } from "@/features/cms/wood-form";
import { RecordAction } from "@/features/cms/record-action";
import { getAllWoodEntries, getWoodEntry } from "@/lib/cms";

export const metadata = { title: "Wood entry" };

export default async function WoodEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [entry, entries] = await Promise.all([getWoodEntry(id), getAllWoodEntries()]);
  if (!entry) notFound();
  const back = `/factory/expenses/wood?month=${entry.period.slice(0, 7)}`;
  const purchasers = [...new Set(entries.map((row) => row.purchaser_name))].sort();
  return <CmsPage title={entry.purchaser_name} eyebrow="Wood entry" backHref={back}>
    <WoodForm entry={entry} purchasers={purchasers} />
    <div className="mt-8"><RecordAction url={`/api/cms/wood/${id}`} confirmation="Remove this wood entry? Its payment will also be removed from general expenses." redirectTo={back} /></div>
  </CmsPage>;
}
