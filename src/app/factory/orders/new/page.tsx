import { CmsPage } from "@/components/cms/cms-page";
import { OrderForm } from "@/features/cms/order-form";
import { getClients } from "@/lib/cms";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata = { title: "New order" };

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const [{ client }, clients] = await Promise.all([
    searchParams,
    hasSupabaseEnv() ? getClients() : Promise.resolve([]),
  ]);

  return (
    <CmsPage backHref="/factory/orders" eyebrow="Orders" title="New order">
      <OrderForm clients={clients} defaultClientId={client} />
    </CmsPage>
  );
}
