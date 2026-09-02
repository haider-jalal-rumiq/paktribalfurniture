import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/motion";
import { InquiryForm } from "@/features/inquiry/inquiry-form";
import { getCategory } from "@/content/catalog";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Contact and enquiries", description: "Send a furniture enquiry to Pak Tribal Furniture and continue the conversation on WhatsApp.", path: "/contact" });

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const selected = category ? getCategory(category) : undefined;
  return (
    <>
      <PageHero eyebrow="Start a conversation" title="Your next piece starts with a few details." description="Share what you need. Your enquiry is recorded, then WhatsApp opens with everything ready to send." />
      <section className="py-16 sm:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <Reveal>
            <h2 className="font-display text-4xl text-ink">Prefer to message directly?</h2>
            <p className="mt-4 max-w-sm text-base leading-7 text-ink-soft">You can reach Pak Tribal Furniture on WhatsApp or browse the latest brand updates on Instagram.</p>
            <div className="mt-7 space-y-3 text-sm font-semibold">
              <a href={site.whatsapp.href} className="block text-accent underline underline-offset-4">WhatsApp {site.whatsapp.display}</a>
              <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="block text-accent underline underline-offset-4">Instagram @paktribalfurniture</a>
            </div>
          </Reveal>
          <Reveal id="enquiry" className="scroll-mt-28 border border-hairline bg-surface p-6 sm:p-10">
            <InquiryForm categorySlug={selected?.slug} />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
