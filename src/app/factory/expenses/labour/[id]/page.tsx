import { notFound } from "next/navigation";
import { CmsPage } from "@/components/cms/cms-page";
import { ButtonLink } from "@/components/ui/button";
import { LabourForm } from "@/features/cms/labour-form";
import { RecordAction } from "@/features/cms/record-action";
import { getLabourEntry } from "@/lib/cms";
export const metadata = { title: "Labour entry" };
export default async function LabourEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getLabourEntry(id);
  if (!entry) notFound();
  const back = `/factory/expenses/labour?month=${entry.period.slice(0, 7)}`;
  return <CmsPage title={entry.name} eyebrow="Labour entry" backHref={back} actions={<ButtonLink size="sm" variant="outline" href={`/factory/expenses/labour/print?month=${entry.period.slice(0, 7)}&entry=${id}`}>Print / PDF</ButtonLink>}>
    <LabourForm entry={entry} /><div className="mt-8"><RecordAction url={`/api/cms/labour/${id}`} confirmation="Remove this labour entry? Its paid amount will also be removed from expenses." redirectTo={back} /></div>
  </CmsPage>;
}
