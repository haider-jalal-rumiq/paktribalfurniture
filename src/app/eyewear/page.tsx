import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Stagger, StaggerItem } from "@/components/motion";
import { AppointmentSection } from "@/components/appointment-section";
import { FrameCard } from "@/features/eyewear/frame-card";
import { FrameFilters } from "@/features/eyewear/frame-filters";
import { filterFrames, isFrameCategory } from "@/features/eyewear/frames";
import { JsonLd, breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Eyewear",
  description:
    "Browse frames at Sundance Optical in Phoenix — men's, women's, kids', sunglasses, and the exclusive Native Visions line. Any doctor's prescription accepted.",
  path: "/eyewear",
});

export default async function EyewearPage({
  searchParams,
}: PageProps<"/eyewear">) {
  const params = await searchParams;
  const raw = typeof params.category === "string" ? params.category : "All";
  // Anything unrecognised falls back to "All" rather than showing nothing.
  const active = isFrameCategory(raw) ? raw : "All";
  const visible = filterFrames(active);

  return (
    <>
      <PageHero
        eyebrow="Eyewear"
        title="Frames you can actually try on"
        lede="A curated wall rather than an endless catalogue. Come in, put them on your face, and let us fit them properly — that is the part a website cannot do."
      />

      <section className="py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <FrameFilters active={active} />
            <p
              aria-live="polite"
              className="text-sm text-stone"
            >
              {visible.length} {visible.length === 1 ? "frame" : "frames"}
              {active !== "All" && ` in ${active}`}
            </p>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-[var(--radius-card)] border border-dashed border-hairline bg-surface p-12 text-center text-ink-soft">
              Nothing in that category online right now — but the wall in the
              shop holds far more than this page does. Call us and we will tell
              you what just came in.
            </p>
          ) : (
            <Stagger
              key={active}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              gap={0.05}
            >
              {visible.map((frame, index) => (
                <StaggerItem key={frame.id} className="h-full">
                  <FrameCard
                    frame={frame}
                    className="h-full"
                    priority={index < 3}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          )}

          <p className="max-w-2xl text-sm leading-relaxed text-stone">
            Prices depend on your prescription and lens choice, so we quote in
            person rather than guessing online. Bring your prescription from any
            doctor and we will walk you through the options.
          </p>
        </Container>
      </section>

      <AppointmentSection />

      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Eyewear", path: "/eyewear" },
        ])}
      />
    </>
  );
}
