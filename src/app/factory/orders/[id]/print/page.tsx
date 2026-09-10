import { notFound } from "next/navigation";
import { CmsPage } from "@/components/cms/cms-page";
import { PrintButton } from "@/components/cms/print-button";
import { OrderDocument } from "@/components/cms/documents";
import { getOrder } from "@/lib/cms";
export const metadata = { title: "Print order" };
export default async function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  return <CmsPage title={`Order #${order.order_no}`} backHref={`/factory/orders/${id}`} actions={<PrintButton />}><p className="print-controls mb-5 text-sm text-muted">Choose Save as PDF in the print window to download and share this order.</p><OrderDocument order={order} /></CmsPage>;
}
