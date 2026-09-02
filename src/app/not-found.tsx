import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return <Container className="flex min-h-[70vh] flex-col items-start justify-center py-32"><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">404</p><h1 className="mt-5 max-w-2xl font-display text-5xl leading-[0.92] text-ink sm:text-6xl">This piece is not in the catalogue.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-ink-soft">The product may be unpublished, or the link may have changed. Browse the current furniture collections instead.</p><div className="mt-8 flex flex-wrap gap-3"><ButtonLink href="/collections">Browse collections</ButtonLink><ButtonLink href="/" variant="outline">Back to home</ButtonLink></div></Container>;
}
