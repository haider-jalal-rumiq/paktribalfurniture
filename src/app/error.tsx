"use client";

import { useEffect } from "react";

import { Container } from "@/components/layout/container";
import { Button, ButtonLink } from "@/components/ui/button";
import { site } from "@/content/site";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("route.error", { digest: error.digest }); }, [error]);
  return <Container className="flex min-h-[70vh] flex-col items-start justify-center py-32"><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Something went wrong</p><h1 className="mt-5 max-w-2xl font-display text-5xl leading-[0.92] text-ink sm:text-6xl">This page did not load properly.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-ink-soft">Try again in a moment. If the problem continues, message Pak Tribal Furniture on WhatsApp at <a href={site.whatsapp.href} className="font-semibold text-accent underline underline-offset-4">{site.whatsapp.display}</a>.</p><div className="mt-8 flex flex-wrap gap-3"><Button onClick={reset}>Try again</Button><ButtonLink href="/" variant="outline">Back to home</ButtonLink></div></Container>;
}
