import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/content/site";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center gap-6 py-32">
      <span className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-clay">
        404
      </span>
      <h1 className="max-w-xl font-display text-4xl text-ink">
        That page is not on the wall
      </h1>
      <p className="max-w-md text-lg leading-relaxed text-ink-soft">
        The link may be out of date. Everything we offer is a click away below
        &mdash; or call us at{" "}
        <a
          href={site.phoneHref}
          className="font-medium text-clay underline underline-offset-4"
        >
          {site.phone}
        </a>{" "}
        and we will point you the right way.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/eyewear" variant="outline">
          Browse frames
        </ButtonLink>
      </div>
    </Container>
  );
}
