import { Mail } from "lucide-react";

import { AppointmentSection } from "@/components/appointment-section";
import { PageHero } from "@/components/layout/page-hero";
import { VisitSection } from "@/components/visit-section";
import { site } from "@/content/site";
import { JsonLd, breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Visit Us",
  description:
    "Sundance Optical, 4201 N 16th Street Suite 160, Phoenix AZ 85016. Open weekdays 8am–5pm. Call (602) 277-5007 or request an appointment online.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Visit us"
        title="On 16th Street, weekdays 8 to 5"
        lede="Walk in, or send a request and we will call you back. Either way you will be talking to the optician, not a call centre."
      >
        <a
          href={`mailto:${site.email}`}
          className="inline-flex items-center gap-2.5 text-base font-medium text-ink-soft transition-colors hover:text-clay"
        >
          <Mail className="h-4 w-4 shrink-0 text-clay" aria-hidden="true" />
          {site.email}
        </a>
      </PageHero>

      <VisitSection heading={false} />
      <AppointmentSection />

      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Visit Us", path: "/contact" },
        ])}
      />
    </>
  );
}
