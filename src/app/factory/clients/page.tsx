import { Plus, Users } from "lucide-react";

import { CmsPage } from "@/components/cms/cms-page";
import { Avatar, RecordList } from "@/components/cms/record-list";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { clientTypeShort } from "@/content/cms";
import { getClients } from "@/lib/cms";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const clients = hasSupabaseEnv() ? await getClients() : [];

  return (
    <CmsPage
      title="Clients"
      actions={
        <ButtonLink href="/factory/clients/new" size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New client
        </ButtonLink>
      }
    >
      <RecordList
        emptyIcon={<Users className="h-8 w-8" aria-hidden="true" />}
        empty="No clients yet. Add the first one to start recording orders."
        rows={clients.map((client) => ({
          id: client.id,
          href: `/factory/clients/${client.id}`,
          lead: <Avatar name={client.name} />,
          title: client.name,
          subtitle: client.phone ?? undefined,
          meta: (
            <Badge tone={client.type === "individual" ? "neutral" : "info"}>
              {clientTypeShort(client.type)}
            </Badge>
          ),
        }))}
      />
    </CmsPage>
  );
}
