import type { Metadata } from "next";
import Image from "next/image";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/motion";
import { InquiryForm } from "@/features/inquiry/inquiry-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Custom furniture", description: "Start a custom furniture enquiry with a reference, preferred dimensions, wood choice, and room context.", path: "/custom", image: "/images/furniture/workshop.jpg" });

const prompts = ["A photo or reference you like", "Approximate width, depth, and height", "Your preferred wood, if you have one", "Where the piece will live and how it will be used"];

export default function CustomFurniturePage() {
  return (
    <>
      <PageHero eyebrow="Custom furniture" title="Bring the room, the need, and the idea." description="A useful brief starts with a reference, dimensions, material preference, and how you plan to use the piece." />
      <section className="py-16 sm:py-24">
        <Container>
          <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal className="relative min-h-[30rem] overflow-hidden bg-canvas-deep"><Image src="/images/furniture/workshop.jpg" alt="Woodworker preparing a custom furniture component" fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" /></Reveal>
            <Reveal className="bg-canvas-deep p-7 sm:p-12">
              <h2 className="font-display text-4xl text-ink sm:text-5xl">What to include</h2>
              <ol className="mt-8 divide-y divide-hairline border-y border-hairline">
                {prompts.map((prompt, index) => <li key={prompt} className="grid grid-cols-[2.5rem_1fr] gap-4 py-5"><span className="font-display text-xl text-accent">0{index + 1}</span><span className="text-sm leading-6 text-ink-soft">{prompt}</span></li>)}
              </ol>
            </Reveal>
          </div>
          <Reveal id="enquiry" className="scroll-mt-28 mt-16 border border-hairline bg-surface p-6 sm:p-10 lg:p-14"><InquiryForm categorySlug="custom-furniture" title="Start a custom furniture enquiry" /></Reveal>
        </Container>
      </section>
    </>
  );
}
