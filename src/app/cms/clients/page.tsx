import { Plus } from "lucide-react";

import { CmsPage } from "@/components/cms/cms-page";
import { RecordList } from "@/components/cms/record-list";
import { ButtonLink } from "@/components/ui/button";
import { clientTypeLabel } from "@/content/cms";
import { getClients } from "@/lib/cms";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const clients = hasSupabaseEnv() ? await getClients() : [];

  return (
    <CmsPage
      title="Clients"
      actions={
        <ButtonLink href="/cms/clients/new" size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New client
        </ButtonLink>
      }
    >
      <div className="mt-6">
        <RecordList
          empty="No clients yet. Add the first one to start recording orders."
          rows={clients.map((client) => ({
            id: client.id,
            href: `/cms/clients/${client.id}`,
            title: client.name,
            subtitle: client.phone ?? undefined,
            meta: clientTypeLabel(client.type),
          }))}
        />
      </div>
    </CmsPage>
  );
}
