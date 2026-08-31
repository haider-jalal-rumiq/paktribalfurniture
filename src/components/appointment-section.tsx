import { Clock, MessageSquare, PhoneCall } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { AppointmentForm } from "@/features/appointment/appointment-form";

const promises = [
  {
    icon: PhoneCall,
    title: "We call you back",
    body: "A real person from the shop, usually the same day.",
  },
  {
    icon: Clock,
    title: "Within one business day",
    body: "Requests sent overnight are answered the next morning.",
  },
  {
    icon: MessageSquare,
    title: "No obligation",
    body: "Ask about coverage or pricing before you commit to anything.",
  },
];

export function AppointmentSection() {
  return (
    <section
      id="appointment"
      className="scroll-mt-28 bg-canvas-deep py-24 sm:py-32"
    >
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-8">
          <Reveal className="flex flex-col gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
              Book a visit
            </span>
            <h2 className="font-display text-3xl text-ink md:text-4xl">
              Tell us what you need
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-ink-soft">
              Send a request and we will call to confirm a time. Prefer to just
              walk in? That works too &mdash; we are open weekdays, 8 to 5.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="flex flex-col gap-5">
              {promises.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-clay">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium text-ink">{title}</p>
                    <p className="text-sm leading-relaxed text-ink-soft">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal
          delay={0.08}
          className="rounded-[var(--radius-card)] border border-hairline bg-surface p-6 sm:p-9"
        >
          <AppointmentForm />
        </Reveal>
      </Container>
    </section>
  );
}
