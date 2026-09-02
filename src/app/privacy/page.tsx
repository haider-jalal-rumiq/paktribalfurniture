import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Privacy", description: "How Pak Tribal Furniture handles catalogue enquiry information.", path: "/privacy" });

export default function PrivacyPage() {
  return (
    <>
      <PageHero title="Privacy, in plain language." description="This page explains what the enquiry form collects and where your information goes." />
      <section className="py-16 sm:py-24"><Container className="max-w-4xl"><div className="space-y-10 text-base leading-8 text-ink-soft">
        <section><h2 className="font-display text-3xl text-ink">Information you provide</h2><p className="mt-4">The enquiry form collects your name, phone number, optional city, furniture preferences, and message so Pak Tribal Furniture can respond to your request.</p></section>
        <section><h2 className="font-display text-3xl text-ink">How it is used</h2><p className="mt-4">Your submission is stored in the website database for enquiry follow-up. After a successful save, WhatsApp opens with a copy of the details ready for you to review and send.</p></section>
        <section><h2 className="font-display text-3xl text-ink">Third-party services</h2><p className="mt-4">This website uses Supabase for authentication, database records, and product image storage. WhatsApp and Instagram have their own privacy terms when you choose to use those services.</p></section>
        <section><h2 className="font-display text-3xl text-ink">Questions</h2><p className="mt-4">For questions about an enquiry you submitted, contact Pak Tribal Furniture on WhatsApp at <a href={site.whatsapp.href} className="font-semibold text-accent underline underline-offset-4">{site.whatsapp.display}</a>.</p></section>
      </div></Container></section>
    </>
  );
}
