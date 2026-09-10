import { CmsPage } from "@/components/cms/cms-page";
import { ClientForm } from "@/features/cms/client-form";

export const metadata = { title: "New client" };

export default function NewClientPage() {
  return (
    <CmsPage backHref="/factory/clients" eyebrow="Clients" title="New client">
      <ClientForm />
    </CmsPage>
  );
}
