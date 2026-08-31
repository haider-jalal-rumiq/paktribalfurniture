import { Quote } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { Stagger, StaggerItem } from "@/components/motion";
import { reviews } from "@/content/site";

export function Reviews() {
  return (
    <section className="bg-canvas-deep py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="In their words"
          title="What people say after they walk out"
          align="center"
        />

        <Stagger
          className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2"
          gap={0.1}
        >
          {reviews.map((review) => (
            <StaggerItem key={review.quote} className="h-full">
              <figure className="flex h-full flex-col gap-5 rounded-[var(--radius-card)] border border-hairline bg-surface p-8">
                <Quote
                  className="h-7 w-7 shrink-0 text-ember"
                  aria-hidden="true"
                />
                <blockquote className="flex-1 font-display text-xl leading-snug text-ink">
                  {review.quote}
                </blockquote>
                <figcaption className="text-sm text-stone">
                  {review.author}
                  <span aria-hidden="true"> · </span>
                  <span className="font-medium text-ink-soft">
                    {review.source}
                  </span>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
