"use client";

import { useEffect } from "react";

import { Container } from "@/components/layout/container";
import { Button, ButtonLink } from "@/components/ui/button";
import { site } from "@/content/site";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the only safe handle on the server-side stack.
    console.error("route.error", { digest: error.digest });
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center gap-6 py-32">
      <span className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-clay">
        Something went wrong
      </span>
      <h1 className="max-w-xl font-display text-4xl text-ink">
        This page did not load properly
      </h1>
      <p className="max-w-md text-lg leading-relaxed text-ink-soft">
        Try again in a moment. If it keeps happening, call us at{" "}
        <a
          href={site.phoneHref}
          className="font-medium text-clay underline underline-offset-4"
        >
          {site.phone}
        </a>{" "}
        &mdash; we are here weekdays, 8 to 5.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">
          Back to home
        </ButtonLink>
      </div>
    </Container>
  );
}
